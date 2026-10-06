import { getAuthToken } from "@/services/storage/authStorage";

export { getAuthToken };

export async function apiClient(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) {
        if (typeof data === "object" && data !== null) {
          return { success: false, ...data, status: res.status };
        }
        return { success: false, message: `Error ${res.status}`, status: res.status };
      }
      return data;
    }

    // Response is not JSON (could be HTML 404 or text)
    const text = await res.text();
    if (!res.ok || text.trim().startsWith("<")) {
      return {
        success: false,
        status: res.status,
        message: !res.ok
          ? `Error del servidor (${res.status}): ${res.statusText || "Respuesta inválida"}`
          : "Respuesta inesperada del servidor"
      };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { success: false, message: text || "Respuesta no estructurada" };
    }
  } catch (err) {
    console.error(`Fetch error at ${endpoint}:`, err);
    return {
      success: false,
      message: err.message || "Error de conexión con el servidor"
    };
  }
}


