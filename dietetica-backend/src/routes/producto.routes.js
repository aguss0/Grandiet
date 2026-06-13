// src/routes/producto.routes.js
const express = require("express");
const { body, validationResult } = require("express-validator");
const prisma  = require("../utils/prisma");
const { authenticate, soloAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// ─── GET /api/productos ──────────────────────────────────────
// Query params: ?buscar=&categoriaId=&activo=&stockBajo=true
router.get("/", async (req, res) => {
  const { buscar, categoriaId, activo, stockBajo } = req.query;

  const where = {};

  if (buscar) {
    where.OR = [
      { nombre:      { contains: buscar, mode: "insensitive" } },
      { marca:       { contains: buscar, mode: "insensitive" } },
      { descripcion: { contains: buscar, mode: "insensitive" } },
    ];
  }
  if (categoriaId) where.categoriaId = Number(categoriaId);
  if (activo !== undefined) where.activo = activo === "true";

  let productos = await prisma.producto.findMany({
    where,
    include: { categoria: true },
    orderBy: { nombre: "asc" },
  });

  // Filtro de stock bajo (no se puede hacer directo en Prisma con columnas calculadas)
  if (stockBajo === "true") {
    productos = productos.filter((p) => p.stockActual <= p.stockMinimo);
  }

  // Añadir margen calculado a cada producto
  const resultado = productos.map((p) => ({
    ...p,
    margenPorcentaje: calcularMargen(p.precioCompra, p.precioVenta),
    stockBajo: p.stockActual <= p.stockMinimo,
  }));

  res.json(resultado);
});

// ─── GET /api/productos/:id ──────────────────────────────────
router.get("/:id", async (req, res) => {
  const producto = await prisma.producto.findUnique({
    where:   { id: Number(req.params.id) },
    include: { categoria: true },
  });
  if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

  res.json({
    ...producto,
    margenPorcentaje: calcularMargen(producto.precioCompra, producto.precioVenta),
    stockBajo: producto.stockActual <= producto.stockMinimo,
  });
});

// ─── POST /api/productos ─────────────────────────────────────
router.post(
  "/",
  [
    body("nombre").notEmpty().withMessage("Nombre requerido"),
    body("categoriaId").isInt().withMessage("Categoría inválida"),
    body("precioCompra").isFloat({ min: 0 }).withMessage("Precio de compra inválido"),
    body("precioVenta").isFloat({ min: 0 }).withMessage("Precio de venta inválido"),
    body("stockMinimo").optional().isInt({ min: 0 }),
    body("stockActual").optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      nombre, categoriaId, marca, descripcion,
      precioCompra, precioVenta,
      stockActual = 0, stockMinimo = 0, unidad = "unidades",
    } = req.body;

    const producto = await prisma.producto.create({
      data: {
        nombre, categoriaId: Number(categoriaId),
        marca, descripcion,
        precioCompra, precioVenta,
        stockActual: Number(stockActual),
        stockMinimo: Number(stockMinimo),
        unidad,
      },
      include: { categoria: true },
    });

    res.status(201).json(producto);
  }
);

// ─── PATCH /api/productos/:id ────────────────────────────────
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const campos = [
    "nombre", "categoriaId", "marca", "descripcion",
    "precioCompra", "precioVenta", "stockMinimo", "unidad", "activo",
  ];
  const data = {};
  for (const campo of campos) {
    if (req.body[campo] !== undefined) data[campo] = req.body[campo];
  }

  const producto = await prisma.producto.update({
    where:   { id },
    data,
    include: { categoria: true },
  });
  res.json(producto);
});

// ─── DELETE lógico /api/productos/:id ────────────────────────
router.delete("/:id", soloAdmin, async (req, res) => {
  await prisma.producto.update({
    where: { id: Number(req.params.id) },
    data:  { activo: false },
  });
  res.json({ mensaje: "Producto desactivado" });
});

// ─── Helper ──────────────────────────────────────────────────
function calcularMargen(precioCompra, precioVenta) {
  const pc = parseFloat(precioCompra);
  const pv = parseFloat(precioVenta);
  if (!pv || pv === 0) return 0;
  return Math.round(((pv - pc) / pv) * 100);
}

module.exports = router;
