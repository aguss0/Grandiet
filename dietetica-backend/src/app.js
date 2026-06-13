// src/app.js
const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const authRoutes       = require("./routes/auth.routes");
const usuarioRoutes    = require("./routes/usuario.routes");
const categoriaRoutes  = require("./routes/categoria.routes");
const productoRoutes   = require("./routes/producto.routes");
const ventaRoutes      = require("./routes/venta.routes");
const stockRoutes      = require("./routes/stock.routes");
const reporteRoutes    = require("./routes/reporte.routes");

const app = express();

// ─── Middlewares globales ────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ─── Rutas ──────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/usuarios",   usuarioRoutes);
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos",  productoRoutes);
app.use("/api/ventas",     ventaRoutes);
app.use("/api/stock",      stockRoutes);
app.use("/api/reportes",   reporteRoutes);

// ─── Health check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ─── Manejo de errores global ────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  const status  = err.status || 500;
  const message = err.message || "Error interno del servidor";
  res.status(status).json({ error: message });
});

module.exports = app;
