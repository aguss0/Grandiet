// src/routes/stock.routes.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const prisma  = require("../utils/prisma");
const { authenticate, soloAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// ─── GET /api/stock/movimientos ──────────────────────────────
// Historial completo de movimientos
router.get("/movimientos", async (req, res) => {
  const { productoId, tipo, desde, hasta, page = 1, limit = 50 } = req.query;

  // Empleados solo ven sus propios movimientos; admin ve todo
  const where = {};
  if (req.usuario.rol.nombre !== "administrador") {
    where.usuarioId = req.usuario.id;
  }
  if (productoId) where.productoId = Number(productoId);
  if (tipo)       where.tipo       = tipo;
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta + "T23:59:59");
  }

  const [movimientos, total] = await prisma.$transaction([
    prisma.movimientoStock.findMany({
      where,
      include: {
        producto: { select: { id: true, nombre: true } },
        usuario:  { select: { id: true, nombre: true } },
      },
      orderBy: { fecha: "desc" },
      skip:    (Number(page) - 1) * Number(limit),
      take:    Number(limit),
    }),
    prisma.movimientoStock.count({ where }),
  ]);

  res.json({ movimientos, total, page: Number(page), limit: Number(limit) });
});

// ─── POST /api/stock/ingresos ────────────────────────────────
// Registra ingreso de mercadería e incrementa stock
router.post(
  "/ingresos",
  [
    body("productoId").isInt().withMessage("Producto inválido"),
    body("cantidad").isInt({ min: 1 }).withMessage("Cantidad debe ser mayor a 0"),
    body("precioReferencia").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { productoId, cantidad, precioReferencia, observaciones } = req.body;
    const usuarioId = req.usuario.id;

    const resultado = await prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: Number(productoId) },
      });
      if (!producto) throw { status: 404, message: "Producto no encontrado" };

      const stockAnterior  = producto.stockActual;
      const stockPosterior = stockAnterior + Number(cantidad);

      // Incrementar stock
      await tx.producto.update({
        where: { id: producto.id },
        data:  { stockActual: stockPosterior },
      });

      // Registrar movimiento
      const movimiento = await tx.movimientoStock.create({
        data: {
          productoId:      producto.id,
          tipo:            "INGRESO",
          cantidad:        Number(cantidad),
          stockAnterior,
          stockPosterior,
          precioReferencia: precioReferencia ? Number(precioReferencia) : null,
          usuarioId,
          observaciones,
        },
      });

      // Actualizar precio de compra si se informó uno nuevo
      if (precioReferencia) {
        await tx.producto.update({
          where: { id: producto.id },
          data:  { precioCompra: Number(precioReferencia) },
        });
      }

      return { movimiento, stockPosterior };
    });

    res.status(201).json({
      mensaje:       "Ingreso registrado correctamente",
      movimiento:    resultado.movimiento,
      stockActual:   resultado.stockPosterior,
    });
  }
);

// ─── POST /api/stock/ajuste — solo admin ─────────────────────
// Corrección manual de stock (inventario físico)
router.post("/ajuste", soloAdmin, async (req, res) => {
  const { productoId, stockNuevo, observaciones } = req.body;
  if (!productoId || stockNuevo === undefined || stockNuevo < 0) {
    return res.status(400).json({ error: "Datos inválidos para ajuste" });
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUnique({ where: { id: Number(productoId) } });
    if (!producto) throw { status: 404, message: "Producto no encontrado" };

    const stockAnterior  = producto.stockActual;
    const diferencia     = Number(stockNuevo) - stockAnterior;

    await tx.producto.update({
      where: { id: producto.id },
      data:  { stockActual: Number(stockNuevo) },
    });

    const movimiento = await tx.movimientoStock.create({
      data: {
        productoId:    producto.id,
        tipo:          "AJUSTE",
        cantidad:      diferencia,
        stockAnterior,
        stockPosterior: Number(stockNuevo),
        usuarioId:     req.usuario.id,
        observaciones: observaciones || `Ajuste manual. Diferencia: ${diferencia}`,
      },
    });

    return movimiento;
  });

  res.status(201).json({ mensaje: "Ajuste registrado", movimiento: resultado });
});

module.exports = router;
