import { apiClient } from "@/services/api/apiClient";

export function getAttendanceApi(params = {}) {
  const search = new URLSearchParams(params).toString();
  return apiClient(`/api/attendance${search ? `?${search}` : ""}`);
}

export function upsertAttendanceApi(record) {
  return apiClient("/api/attendance", {
    method: "POST",
    body: JSON.stringify(record)
  });
}

export function getAttendanceSummaryApi(params = {}) {
  const search = new URLSearchParams(params).toString();
  return apiClient(`/api/attendance/summary${search ? `?${search}` : ""}`);
}
