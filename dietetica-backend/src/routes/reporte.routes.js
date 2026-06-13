// src/routes/reporte.routes.js
const express = require("express");
const prisma  = require("../utils/prisma");
const { authenticate, soloAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, soloAdmin);

// ─── Helper: rango de fechas ──────────────────────────────────
function getRango(periodo) {
  const ahora  = new Date();
  const desde  = new Date(ahora);
  if (periodo === "dia") {
    desde.setHours(0, 0, 0, 0);
  } else if (periodo === "semana") {
    desde.setDate(ahora.getDate() - 7);
  } else {
    // mes por defecto
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);
  }
  return { desde, hasta: ahora };
}

// ─── GET /api/reportes/resumen ────────────────────────────────
// Dashboard: métricas principales
router.get("/resumen", async (_req, res) => {
  const { desde: desdeSemana } = getRango("semana");
  const { desde: desdeMes    } = getRango("mes");
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const hoy    = new Date(); hoy.setHours(0, 0, 0, 0);

  const [
    ventasSemana,
    gananciaMes,
    productosStockBajo,
    movimientosHoy,
    sinMovimiento,
  ] = await Promise.all([
    // Total vendido en la semana
    prisma.venta.aggregate({
      where:   { fecha: { gte: desdeSemana } },
      _sum:    { precioVenta: true, cantidad: true },
      _count:  { id: true },
    }),
    // Ganancia del mes
    prisma.venta.aggregate({
      where:  { fecha: { gte: desdeMes } },
      _sum:   { ganancia: true },
    }),
    // Productos con stock bajo
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM productos
      WHERE activo = true AND stock_actual <= stock_minimo
    `,
    // Movimientos de hoy
    prisma.movimientoStock.count({
      where: { fecha: { gte: hoy } },
    }),
    // Productos sin movimiento en 30 días
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT p.id)::int AS total
      FROM productos p
      WHERE p.activo = true
        AND p.id NOT IN (
          SELECT DISTINCT producto_id
          FROM movimientos_stock
          WHERE fecha >= ${hace30}
        )
    `,
  ]);

  res.json({
    ventasSemana: {
      total:        Number(ventasSemana._sum.precioVenta || 0),
      transacciones: ventasSemana._count.id,
      unidades:     ventasSemana._sum.cantidad || 0,
    },
    gananciaMes:       Number(gananciaMes._sum.ganancia || 0),
    productosStockBajo: productosStockBajo[0]?.total || 0,
    movimientosHoy,
    sinMovimiento30dias: sinMovimiento[0]?.total || 0,
  });
});

// ─── GET /api/reportes/ventas ─────────────────────────────────
// ?periodo=dia|semana|mes  o  ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get("/ventas", async (req, res) => {
  let desde, hasta;
  if (req.query.desde) {
    desde = new Date(req.query.desde);
    hasta = req.query.hasta ? new Date(req.query.hasta + "T23:59:59") : new Date();
  } else {
    const rango = getRango(req.query.periodo || "mes");
    desde = rango.desde;
    hasta = rango.hasta;
  }

  const ventas = await prisma.venta.findMany({
    where:   { fecha: { gte: desde, lte: hasta } },
    include: {
      producto:  { select: { nombre: true, categoria: true } },
      usuario:   { select: { nombre: true } },
    },
    orderBy: { fecha: "desc" },
  });

  // Agrupar por día
  const porDia = {};
  for (const v of ventas) {
    const dia = v.fecha.toISOString().split("T")[0];
    if (!porDia[dia]) porDia[dia] = { fecha: dia, totalVentas: 0, ganancia: 0, transacciones: 0 };
    porDia[dia].totalVentas   += Number(v.precioVenta) * v.cantidad;
    porDia[dia].ganancia      += Number(v.ganancia);
    porDia[dia].transacciones += 1;
  }

  res.json({
    desde:        desde.toISOString(),
    hasta:        hasta.toISOString(),
    totalVentas:  ventas.reduce((s, v) => s + Number(v.precioVenta) * v.cantidad, 0),
    totalGanancia: ventas.reduce((s, v) => s + Number(v.ganancia), 0),
    transacciones: ventas.length,
    porDia:       Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    detalle:      ventas,
  });
});

// ─── GET /api/reportes/ranking ────────────────────────────────
// ?tipo=unidades|facturacion|ganancia  &periodo=mes|semana|dia  &limit=10
router.get("/ranking", async (req, res) => {
  const { tipo = "unidades", limit = 10 } = req.query;
  const { desde } = getRango(req.query.periodo || "mes");

  const ventas = await prisma.venta.groupBy({
    by:    ["productoId"],
    where: { fecha: { gte: desde } },
    _sum:  { cantidad: true, precioVenta: true, ganancia: true },
    orderBy: tipo === "unidades"
      ? { _sum: { cantidad: "desc" } }
      : tipo === "facturacion"
      ? { _sum: { precioVenta: "desc" } }
      : { _sum: { ganancia: "desc" } },
    take: Number(limit),
  });

  // Enriquecer con datos del producto
  const productoIds = ventas.map((v) => v.productoId);
  const productos   = await prisma.producto.findMany({
    where:   { id: { in: productoIds } },
    include: { categoria: true },
  });
  const prodMap = Object.fromEntries(productos.map((p) => [p.id, p]));

  const ranking = ventas.map((v, i) => {
    const prod = prodMap[v.productoId];
    return {
      posicion:    i + 1,
      productoId:  v.productoId,
      nombre:      prod?.nombre || "Desconocido",
      categoria:   prod?.categoria?.nombre,
      unidades:    v._sum.cantidad || 0,
      facturacion: Number(v._sum.precioVenta || 0),
      ganancia:    Number(v._sum.ganancia || 0),
    };
  });

  res.json({ tipo, periodo: req.query.periodo || "mes", ranking });
});

// ─── GET /api/reportes/alertas ────────────────────────────────
router.get("/alertas", async (_req, res) => {
  const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [stockBajo, sinMovimiento] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, nombre, stock_actual AS "stockActual", stock_minimo AS "stockMinimo", unidad
      FROM productos
      WHERE activo = true AND stock_actual <= stock_minimo
      ORDER BY (stock_actual::float / NULLIF(stock_minimo, 0)) ASC
    `,
    prisma.$queryRaw`
      SELECT p.id, p.nombre, p.stock_actual AS "stockActual",
        MAX(m.fecha) AS "ultimoMovimiento",
        EXTRACT(DAY FROM NOW() - MAX(m.fecha))::int AS "diasSinMovimiento"
      FROM productos p
      LEFT JOIN movimientos_stock m ON m.producto_id = p.id
      WHERE p.activo = true
      GROUP BY p.id, p.nombre, p.stock_actual
      HAVING MAX(m.fecha) IS NULL OR MAX(m.fecha) < ${hace30}
      ORDER BY "diasSinMovimiento" DESC NULLS FIRST
    `,
  ]);

  res.json({ stockBajo, sinMovimiento });
});

// ─── GET /api/reportes/ganancias ──────────────────────────────
// Ganancia por categoría en el período
router.get("/ganancias", async (req, res) => {
  const { desde } = getRango(req.query.periodo || "mes");

  const datos = await prisma.$queryRaw`
    SELECT
      c.nombre                           AS categoria,
      COUNT(v.id)::int                   AS transacciones,
      SUM(v.cantidad)::int               AS unidades,
      ROUND(SUM(v.precio_venta * v.cantidad)::numeric, 2) AS facturacion,
      ROUND(SUM(v.ganancia)::numeric, 2) AS ganancia,
      ROUND(
        AVG((v.precio_venta - v.precio_compra) / NULLIF(v.precio_venta, 0) * 100)::numeric,
        1
      ) AS margenPromedio
    FROM ventas v
    JOIN productos p  ON p.id = v.producto_id
    JOIN categorias c ON c.id = p.categoria_id
    WHERE v.fecha >= ${desde}
    GROUP BY c.nombre
    ORDER BY ganancia DESC
  `;

  res.json({
    periodo:     req.query.periodo || "mes",
    porCategoria: datos,
    totales: {
      facturacion: datos.reduce((s, d) => s + Number(d.facturacion), 0),
      ganancia:    datos.reduce((s, d) => s + Number(d.ganancia), 0),
    },
  });
});

module.exports = router;
