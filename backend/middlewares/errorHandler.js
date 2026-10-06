/**
 * Global Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error("Unhandled server error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ success: false, message });
}
