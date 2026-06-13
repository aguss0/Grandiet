// src/routes/categoria.routes.js
const express = require("express");
const prisma  = require("../utils/prisma");
const { authenticate, soloAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

// GET /api/categorias
router.get("/", async (_req, res) => {
  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { productos: true } } },
  });
  res.json(categorias);
});

// POST /api/categorias — solo admin
router.post("/", soloAdmin, async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Nombre requerido" });
  const cat = await prisma.categoria.create({ data: { nombre } });
  res.status(201).json(cat);
});

module.exports = router;
