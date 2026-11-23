/**
 * Global Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Las fotografías superan el tamaño permitido. Cada fotografía debe pesar como máximo 1 MB." });
  }
  console.error("Unhandled server error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ success: false, message });
}
