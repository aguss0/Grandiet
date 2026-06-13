// src/routes/venta.routes.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const prisma  = require("../utils/prisma");
const { authenticate, soloAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// ─── GET /api/ventas ─────────────────────────────────────────
// Query: ?desde=&hasta=&productoId=&usuarioId=
router.get("/", soloAdmin, async (req, res) => {
  const { desde, hasta, productoId, usuarioId } = req.query;
  const where = {};

  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = new Date(desde);
    if (hasta) where.fecha.lte = new Date(hasta + "T23:59:59");
  }
  if (productoId) where.productoId = Number(productoId);
  if (usuarioId)  where.usuarioId  = Number(usuarioId);

  const ventas = await prisma.venta.findMany({
    where,
    include: {
      producto: { select: { id: true, nombre: true, categoria: true } },
      usuario:  { select: { id: true, nombre: true } },
    },
    orderBy: { fecha: "desc" },
  });

  res.json(ventas);
});

// ─── POST /api/ventas ─────────────────────────────────────────
// Registra la venta y descuenta stock en una sola transacción
router.post(
  "/",
  [
    body("productoId").isInt().withMessage("Producto inválido"),
    body("cantidad").isInt({ min: 1 }).withMessage("Cantidad debe ser mayor a 0"),
    body("precioVenta").optional().isFloat({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { productoId, cantidad, precioVenta: pvCustom, observaciones } = req.body;
    const usuarioId = req.usuario.id;

    // Transacción atómica: verificar stock, crear venta y mover stock
    try {
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Obtener producto con lock para evitar condiciones de carrera
        const producto = await tx.producto.findUnique({
          where: { id: Number(productoId) },
        });

        if (!producto) throw { status: 404, message: "Producto no encontrado" };
        if (!producto.activo) throw { status: 400, message: "El producto está inactivo" };
        if (producto.stockActual < cantidad) {
          throw {
            status: 400,
            message: `Stock insuficiente. Disponible: ${producto.stockActual} ${producto.unidad}`,
          };
        }

        const pv = pvCustom ? Number(pvCustom) : Number(producto.precioVenta);
        const pc = Number(producto.precioCompra);
        const ganancia = (pv - pc) * cantidad;
        const stockAnterior = producto.stockActual;
        const stockPosterior = stockAnterior - cantidad;

        // 2. Registrar venta
        const venta = await tx.venta.create({
          data: {
            productoId: producto.id,
            cantidad,
            precioVenta:  pv,
            precioCompra: pc,
            ganancia,
            usuarioId,
            observaciones,
          },
        });

        // 3. Descontar stock
        await tx.producto.update({
          where: { id: producto.id },
          data:  { stockActual: stockPosterior },
        });

        // 4. Registrar movimiento
        await tx.movimientoStock.create({
          data: {
            productoId,
            tipo:            "VENTA",
            cantidad:        -cantidad,
            stockAnterior,
            stockPosterior,
            precioReferencia: pv,
            usuarioId,
            observaciones,
            ventaId:         venta.id,
          },
        });

        return { venta, stockPosterior };
      });

      res.status(201).json({
        mensaje:        "Venta registrada correctamente",
        venta:          resultado.venta,
        stockRestante:  resultado.stockPosterior,
      });
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      throw err;
    }
  }
);

module.exports = router;
