// src/middleware/auth.js
const jwt    = require("jsonwebtoken");
const prisma = require("../utils/prisma");

// ─── Verifica el token JWT ────────────────────────────────────
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Verificar que el usuario siga activo en la BD
    const usuario = await prisma.usuario.findUnique({
      where:   { id: payload.id },
      include: { rol: true },
    });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: "Usuario inactivo o no encontrado" });
    }
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// ─── Verifica que el usuario sea administrador ────────────────
function soloAdmin(req, res, next) {
  if (req.usuario?.rol?.nombre !== "administrador") {
    return res.status(403).json({ error: "Acción reservada para administradores" });
  }
  next();
}

module.exports = { authenticate, soloAdmin };
