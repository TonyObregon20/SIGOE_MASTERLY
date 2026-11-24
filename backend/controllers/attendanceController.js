import AttendanceModel from "../models/Attendance.js";
import UserModel from "../models/User.js";

function timeToMinutes(value) {
  if (!/^\d{2}:\d{2}$/.test(String(value || ""))) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function calculateRecord(worker, body) {
  const checkIn = String(body.checkIn || "");
  const checkOut = String(body.checkOut || "");
  const breakMinutes = Math.max(0, Math.min(1440, Number(body.breakMinutes) || 0));
  const entry = timeToMinutes(checkIn);
  const exit = timeToMinutes(checkOut);
  let totalHours = 0;

  if (entry !== null && exit !== null && exit > entry) {
    totalHours = Math.max(0, (exit - entry - breakMinutes) / 60);
  }

  const hourlyRate = Math.max(0, Number(body.hourlyRate ?? worker.hourlyRate) || 0);
  return {
    checkIn,
    checkOut,
    breakMinutes,
    absent: body.absent === true,
    hourlyRate,
    totalHours: Number(totalHours.toFixed(2)),
    totalAmount: Number((totalHours * hourlyRate).toFixed(2))
  };
}

export const getAttendance = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const workerId = isAdmin ? req.query.workerId : req.currentUser.id;
    const filter = {};
    if (workerId) filter.workerId = workerId;
    if (req.query.from) filter.date = { ...(filter.date || {}), $gte: req.query.from };
    if (req.query.to) filter.date = { ...(filter.date || {}), $lte: req.query.to };

    const list = await AttendanceModel.find(filter).sort({ date: -1 }).lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const upsertAttendance = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const workerId = isAdmin ? req.body.workerId : req.currentUser.id;
    if (!workerId) return res.status(400).json({ success: false, message: "Trabajador requerido." });
    if (!req.body.date) return res.status(400).json({ success: false, message: "Fecha requerida." });

    const worker = await UserModel.findOne({ id: workerId, role: "worker" });
    if (!worker) return res.status(404).json({ success: false, message: "Trabajador no encontrado." });

    if (!isAdmin && req.body.status && req.body.status !== "borrador") {
      return res.status(403).json({ success: false, message: "Solo un administrador puede aprobar o pagar asistencia." });
    }

    const entry = timeToMinutes(req.body.checkIn);
    const exit = timeToMinutes(req.body.checkOut);
    if (req.body.checkIn && entry === null) return res.status(400).json({ success: false, message: "Hora de entrada inválida." });
    if (req.body.checkOut && exit === null) return res.status(400).json({ success: false, message: "Hora de salida inválida." });
    if (entry !== null && exit !== null && exit <= entry) {
      return res.status(400).json({ success: false, message: "La hora de salida debe ser posterior a la entrada." });
    }

    const calculated = calculateRecord(worker, req.body);
    const status = isAdmin && req.body.status ? req.body.status : "borrador";

    const record = await AttendanceModel.findOneAndUpdate(
      { workerId, date: req.body.date },
      {
        $set: {
          workerId,
          workerName: worker.name,
          date: req.body.date,
          ...calculated,
          status
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, attendance: record });
  } catch (err) {
    next(err);
  }
};

export const getAttendanceSummary = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin";
    const workerId = isAdmin ? req.query.workerId : req.currentUser.id;
    if (!workerId) return res.status(400).json({ success: false, message: "Trabajador requerido." });

    const list = await AttendanceModel.find({
      workerId,
      ...(req.query.from || req.query.to ? {
        date: {
          ...(req.query.from ? { $gte: req.query.from } : {}),
          ...(req.query.to ? { $lte: req.query.to } : {})
        }
      } : {})
    }).lean();

    const totalHours = list.reduce((sum, record) => sum + (Number(record.totalHours) || 0), 0);
    const totalAmount = list.reduce((sum, record) => sum + (Number(record.totalAmount) || 0), 0);
    const absentDays = list.filter((record) => record.absent === true).length;

    res.json({
      success: true,
      totalHours: Number(totalHours.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      absentDays,
      records: list.length
    });
  } catch (err) {
    next(err);
  }
};
