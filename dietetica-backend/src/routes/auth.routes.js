// src/routes/auth.routes.js
const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const prisma  = require("../utils/prisma");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Contraseña requerida"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where:   { email },
      include: { rol: true },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      usuario: {
        id:     usuario.id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol.nombre,
      },
    });
  }
);

// GET /api/auth/me — devuelve el perfil del usuario autenticado
router.get("/me", authenticate, (req, res) => {
  const { passwordHash, ...perfil } = req.usuario;
  res.json(perfil);
});

module.exports = router;
