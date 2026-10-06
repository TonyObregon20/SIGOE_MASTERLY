import express from "express";
import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import kardexRoutes from "./routes/kardexRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { setupViteMiddleware } from "./middlewares/viteMiddleware.js";

export async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());
  app.use(requestLogger);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Mount API routes
  app.use("/api", userRoutes);
  app.use("/api", productRoutes);
  app.use("/api", supplierRoutes);
  app.use("/api", orderRoutes);
  app.use("/api", productionRoutes);
  app.use("/api", warehouseRoutes);
  app.use("/api", kardexRoutes);
  app.use("/api", invoiceRoutes);

  // 404 handler for unmatched API routes (prevents falling through to Vite SPA fallback)
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      success: false,
      message: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}`
    });
  });

  // Error handling middleware for API routes
  app.use(errorHandler);

  // Vite middleware for frontend development and static asset serving
  await setupViteMiddleware(app);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Connect to MongoDB Atlas asynchronously
  connectDB().catch((err) => {
    console.error("Async DB Connection error:", err.message);
  });
}

// Auto start when called directly
startServer();
