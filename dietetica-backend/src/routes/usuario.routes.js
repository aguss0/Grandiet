// src/routes/usuario.routes.js
const express = require("express");
const bcrypt  = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const prisma  = require("../utils/prisma");
const { authenticate, soloAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, soloAdmin); // todas las rutas requieren admin

const CAMPOS_PUBLICOS = {
  id: true, nombre: true, email: true,
  activo: true, creadoEn: true, rol: true,
};

// GET /api/usuarios
router.get("/", async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: CAMPOS_PUBLICOS,
    orderBy: { nombre: "asc" },
  });
  res.json(usuarios);
});

// POST /api/usuarios
router.post(
  "/",
  [
    body("nombre").notEmpty().withMessage("Nombre requerido"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 6 }).withMessage("Mínimo 6 caracteres"),
    body("rolId").isInt().withMessage("Rol inválido"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, email, password, rolId } = req.body;
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ error: "El email ya está registrado" });

    const passwordHash = await bcrypt.hash(password, 10);
    const nuevo = await prisma.usuario.create({
      data: { nombre, email, passwordHash, rolId: Number(rolId) },
      select: CAMPOS_PUBLICOS,
    });
    res.status(201).json(nuevo);
  }
);

// PATCH /api/usuarios/:id
router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, activo, rolId } = req.body;
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (activo !== undefined) data.activo = activo;
  if (rolId  !== undefined) data.rolId  = Number(rolId);

  const actualizado = await prisma.usuario.update({
    where: { id },
    data,
    select: CAMPOS_PUBLICOS,
  });
  res.json(actualizado);
});

module.exports = router;
