// src/components/layout/Sidebar.js
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { path: "/",           label: "Dashboard",       icono: "📊" },
  { path: "/productos",  label: "Productos",        icono: "📦" },
  { path: "/ventas",     label: "Registrar venta",  icono: "🛒" },
  { path: "/stock",      label: "Ingreso de stock", icono: "🚚" },
];

const navAdmin = [
  { path: "/reportes",   label: "Reportes",         icono: "📈" },
  { path: "/movimientos",label: "Movimientos",       icono: "🕓" },
  { path: "/usuarios",   label: "Usuarios",          icono: "👥" },
];

export function Sidebar() {
  const { usuario, logout, esAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const s = {
    aside: {
      width: 220, background: "var(--green-dark)", color: "#fff",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "fixed", top: 0, left: 0, zIndex: 100,
    },
    logo: {
      padding: "20px 16px 16px",
      borderBottom: "1px solid rgba(255,255,255,.1)",
      display: "flex", alignItems: "center", gap: 10,
    },
    logoIcon: {
      width: 34, height: 34, background: "var(--orange)",
      borderRadius: 8, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 18, flexShrink: 0,
    },
    nav: { flex: 1, padding: "12px 0", overflowY: "auto" },
    link: (activo) => ({
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 16px", color: activo ? "#fff" : "rgba(255,255,255,.7)",
      cursor: "pointer", fontSize: 13,
      borderLeft: `3px solid ${activo ? "var(--orange)" : "transparent"}`,
      background: activo ? "rgba(255,255,255,.12)" : "transparent",
      transition: "all .15s",
    }),
    section: {
      fontSize: 10, color: "rgba(255,255,255,.35)",
      padding: "12px 16px 4px", textTransform: "uppercase", letterSpacing: ".08em",
    },
    userBox: {
      padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.1)",
      display: "flex", alignItems: "center", gap: 10,
    },
    avatar: {
      width: 32, height: 32, borderRadius: "50%",
      background: "var(--green-mid)", display: "flex",
      alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 500, color: "#fff", flexShrink: 0,
    },
  };

  const iniciales = usuario?.nombre?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside style={s.aside}>
      <div style={s.logo}>
        <div style={s.logoIcon}>🌿</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>NaturaSur</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>Sistema de gestión</div>
        </div>
      </div>

      <nav style={s.nav}>
        {navItems.map(item => (
          <div
            key={item.path}
            style={s.link(location.pathname === item.path)}
            onClick={() => navigate(item.path)}
          >
            <span>{item.icono}</span>
            <span>{item.label}</span>
          </div>
        ))}

        {esAdmin && (
          <>
            <div style={s.section}>Administración</div>
            {navAdmin.map(item => (
              <div
                key={item.path}
                style={s.link(location.pathname === item.path)}
                onClick={() => navigate(item.path)}
              >
                <span>{item.icono}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </>
        )}
      </nav>

      <div style={s.userBox}>
        <div style={s.avatar}>{iniciales}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {usuario?.nombre}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>
            {usuario?.rol}
          </div>
        </div>
        <button
          onClick={logout}
          title="Cerrar sesión"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", fontSize: 16, cursor: "pointer" }}
        >
          ⏻
        </button>
      </div>
    </aside>
  );
}