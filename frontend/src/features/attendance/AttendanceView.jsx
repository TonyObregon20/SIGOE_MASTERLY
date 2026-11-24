import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Download, RefreshCw, Save, UserRound } from "lucide-react";
import { getAttendanceApi, upsertAttendanceApi, getAttendanceSummaryApi } from "./attendanceApi";

function getWeekDates(reference = new Date()) {
  const monday = new Date(reference);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  });
}

export default function AttendanceView({ currentUser, users = [] }) {
  const isAdmin = currentUser?.role === "admin";
  const workers = useMemo(() => users.filter((user) => user.role === "worker"), [users]);
  const [workerId, setWorkerId] = useState(isAdmin ? "" : currentUser?.id || "");
  const [weekStart, setWeekStart] = useState(() => getWeekDates()[0]);
  const [records, setRecords] = useState({});
  const [summary, setSummary] = useState({ totalHours: 0, totalAmount: 0, absentDays: 0, records: 0 });
  const [saving, setSaving] = useState(false);
  const weekDates = useMemo(() => getWeekDates(new Date(`${weekStart}T00:00:00`)), [weekStart]);

  const selectedWorker = isAdmin
    ? workers.find((worker) => worker.id === workerId)
    : currentUser;
  const hourlyRate = Number(selectedWorker?.hourlyRate) || 0;

  const loadAttendance = async () => {
    if (!workerId) {
      setRecords({});
      setSummary({ totalHours: 0, totalAmount: 0, absentDays: 0, records: 0 });
      return;
    }
    const params = { workerId, from: weekDates[0], to: weekDates[6] };
    const [attendanceResult, summaryResult] = await Promise.all([
      getAttendanceApi(params),
      getAttendanceSummaryApi(params)
    ]);
    const mapped = {};
    if (Array.isArray(attendanceResult)) {
      attendanceResult.forEach((record) => { mapped[record.date] = record; });
    }
    setRecords(mapped);
    if (summaryResult?.success) setSummary(summaryResult);
  };

  useEffect(() => {
    if (!isAdmin && currentUser?.id) setWorkerId(currentUser.id);
  }, [isAdmin, currentUser?.id]);

  useEffect(() => { loadAttendance(); }, [workerId, weekStart]);

  const updateRecord = (date, field, value) => {
    setRecords((previous) => ({
      ...previous,
      [date]: {
        ...(previous[date] || {}),
        date,
        workerId,
        [field]: value,
        ...(field === "absent" && value ? { checkIn: "", checkOut: "" } : {})
      }
    }));
  };

  const calculateRow = (record) => {
    if (record?.absent) return { hours: 0, amount: 0 };
    if (!record?.checkIn || !record?.checkOut) return { hours: 0, amount: 0 };
    const [inHour, inMinute] = record.checkIn.split(":").map(Number);
    const [outHour, outMinute] = record.checkOut.split(":").map(Number);
    if ([inHour, inMinute, outHour, outMinute].some(Number.isNaN)) return { hours: 0, amount: 0 };
    const minutes = outHour * 60 + outMinute - inHour * 60 - inMinute - (Number(record.breakMinutes) || 0);
    const hours = Math.max(0, minutes / 60);
    return { hours: Number(hours.toFixed(2)), amount: Number((hours * hourlyRate).toFixed(2)) };
  };

  const saveRecord = async (date) => {
    if (!isAdmin || !workerId) return;
    setSaving(true);
    const record = records[date] || { date, workerId };
    await upsertAttendanceApi({
      workerId,
      date,
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      breakMinutes: Number(record.breakMinutes) || 0,
      absent: record.absent === true,
      hourlyRate,
      status: record.status || "borrador"
    });
    await loadAttendance();
    setSaving(false);
  };

  const calculateWeeklySalary = async () => {
    if (!workerId) return;
    await loadAttendance();
  };

  const generateReport = () => {
    if (!workerId) return;
    const rows = [
      ["Fecha", "Estado", "Entrada", "Salida", "Descanso (min)", "Horas", "Sueldo/hora", "Total"],
      ...weekDates.map((date) => {
        const record = records[date] || {};
        const calculated = calculateRow(record);
        return [
          date,
          record.absent ? "Falta" : record.checkIn || record.checkOut ? "Asistió" : "Sin registrar",
          record.checkIn || "",
          record.checkOut || "",
          record.breakMinutes || 0,
          calculated.hours,
          hourlyRate,
          calculated.amount
        ];
      }),
      ["TOTAL", "", "", "", "", summary.totalHours, "", summary.totalAmount]
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `asistencia-${selectedWorker?.name || workerId}-${weekDates[0]}-${weekDates[6]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-shop-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-medium text-shop-ink">
            <Clock className="size-6 text-shop-blue" /> {isAdmin ? "Asistencia" : "Mi asistencia"}
          </h1>
          <p className="mt-1 text-xs text-shop-muted">
            {isAdmin ? "Gestiona entradas, faltas y sueldo semanal." : "Consulta tus horas y sueldo registrado."}
          </p>
        </div>
        {isAdmin && (
          <select value={workerId} onChange={(event) => setWorkerId(event.target.value)} className="min-h-10 border border-shop-line bg-white px-3 text-sm">
            <option value="">Seleccionar trabajador</option>
            {workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.name}</option>)}
          </select>
        )}
      </div>

      {workerId ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="border border-shop-line bg-white p-5"><p className="text-xs text-shop-muted">Trabajador</p><p className="mt-2 truncate font-semibold">{selectedWorker?.name || "-"}</p></div>
            <div className="border border-shop-line bg-white p-5"><p className="text-xs text-shop-muted">Horas semanales</p><p className="mt-2 text-2xl font-semibold">{summary.totalHours} h</p></div>
            <div className="border border-shop-line bg-white p-5"><p className="text-xs text-shop-muted">Faltas</p><p className="mt-2 text-2xl font-semibold text-red-600">{summary.absentDays}</p></div>
            <div className="border border-shop-line bg-white p-5"><p className="text-xs text-shop-muted">Sueldo calculado</p><p className="mt-2 text-2xl font-semibold text-emerald-700">S/ {Number(summary.totalAmount || 0).toFixed(2)}</p></div>
          </div>

          <div className="flex flex-col gap-3 border border-shop-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-shop-blue" />
              <label className="text-xs text-shop-muted">Semana desde</label>
              <input type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} className="min-h-10 border border-shop-line px-2 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              {isAdmin && <button type="button" onClick={calculateWeeklySalary} className="inline-flex min-h-10 items-center gap-2 border border-shop-blue px-4 text-xs font-medium text-shop-blue"><RefreshCw className="size-3.5" />Calcular sueldo</button>}
              {isAdmin && <button type="button" onClick={generateReport} className="inline-flex min-h-10 items-center gap-2 bg-shop-ink px-4 text-xs font-medium text-white"><Download className="size-3.5" />Generar reporte</button>}
            </div>
          </div>

          <div className="overflow-x-auto border border-shop-line bg-white">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b border-shop-line bg-shop-light text-shop-muted">
                <tr>
                  <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Entrada</th><th className="px-4 py-3">Salida</th><th className="px-4 py-3">Descanso</th><th className="px-4 py-3">Falta</th><th className="px-4 py-3">Horas</th><th className="px-4 py-3">Sueldo</th>{isAdmin && <th className="px-4 py-3 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-shop-line">
                {weekDates.map((date) => {
                  const record = records[date] || {};
                  const calculated = calculateRow(record);
                  return (
                    <tr key={date} className={record.absent ? "bg-red-50/40" : ""}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><CalendarDays className="size-3.5" /><span className="capitalize">{formatDate(date)}</span></div></td>
                      <td className="px-4 py-3">{isAdmin ? <input type="time" disabled={record.absent} value={record.checkIn || ""} onChange={(event) => updateRecord(date, "checkIn", event.target.value)} className="min-h-9 border border-shop-line px-2 disabled:bg-slate-100" /> : <span>{record.checkIn || "-"}</span>}</td>
                      <td className="px-4 py-3">{isAdmin ? <input type="time" disabled={record.absent} value={record.checkOut || ""} onChange={(event) => updateRecord(date, "checkOut", event.target.value)} className="min-h-9 border border-shop-line px-2 disabled:bg-slate-100" /> : <span>{record.checkOut || "-"}</span>}</td>
                      <td className="px-4 py-3">{isAdmin ? <span><input type="number" min="0" disabled={record.absent} value={record.breakMinutes || 0} onChange={(event) => updateRecord(date, "breakMinutes", event.target.value)} className="h-9 w-20 border border-shop-line px-2 disabled:bg-slate-100" /> min</span> : <span>{record.breakMinutes || 0} min</span>}</td>
                      <td className="px-4 py-3">{isAdmin ? <label className="inline-flex items-center gap-2"><input type="checkbox" checked={record.absent === true} onChange={(event) => updateRecord(date, "absent", event.target.checked)} className="size-4 accent-red-600" /><span className={record.absent ? "font-semibold text-red-600" : "text-shop-muted"}>Falta</span></label> : <span className={record.absent ? "font-semibold text-red-600" : "text-shop-muted"}>{record.absent ? "Sí" : "No"}</span>}</td>
                      <td className="px-4 py-3 font-semibold">{calculated.hours} h</td>
                      <td className="px-4 py-3 font-semibold">S/ {calculated.amount.toFixed(2)}</td>
                      {isAdmin && <td className="px-4 py-3 text-right"><button type="button" disabled={saving} onClick={() => saveRecord(date)} className="inline-flex min-h-9 items-center gap-1.5 bg-shop-ink px-3 text-white"><Save className="size-3.5" />Guardar</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="border border-shop-line bg-white py-16 text-center text-sm text-shop-muted"><UserRound className="mx-auto mb-3 size-8" />Selecciona un trabajador para revisar asistencia.</div>
      )}
    </div>
  );
}
