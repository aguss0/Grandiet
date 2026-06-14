// src/pages/stock/Movimientos.js
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { stockService } from "../../services/stockService";

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-AR");
}

function fmtFecha(f) {
  const d = new Date(f);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function Movimientos() {
  const hoy = new Date().toISOString().split("T")[0];
  const [tipo, setTipo]   = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [pagina, setPagina] = useState(1);

  const params = { page: pagina, limit: 50 };
  if (tipo)  params.tipo  = tipo;
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;

  const { data, isLoading } = useQuery({
    queryKey: ["movimientos", params],
    queryFn:  () => stockService.movimientos(params),
  });

  const movimientos = data?.movimientos || [];
  const total       = data?.total || 0;
  const totalPaginas = Math.ceil(total / 50);

  const inputStyle = {
    padding: "8px 10px", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", fontSize: 13,
    fontFamily: "inherit", background: "var(--card)",
  };

  return (
    <Layout titulo="Historial de movimientos">

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select style={inputStyle} value={tipo} onChange={e => { setTipo(e.target.value); setPagina(1); }}>
          <option value="">Todos los tipos</option>
          <option value="VENTA">Ventas</option>
          <option value="INGRESO">Ingresos</option>
          <option value="AJUSTE">Ajustes</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Desde</label>
          <input type="date" style={inputStyle} value={desde} onChange={e => { setDesde(e.target.value); setPagina(1); }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Hasta</label>
          <input type="date" style={inputStyle} value={hasta} max={hoy} onChange={e => { setHasta(e.target.value); setPagina(1); }} />
        </div>
        {(tipo || desde || hasta) && (
          <button
            onClick={() => { setTipo(""); setDesde(""); setHasta(""); setPagina(1); }}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: 12, cursor: "pointer", color: "var(--muted)" }}
          >
            Limpiar filtros
          </button>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
          {total} movimiento{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Tabla ── */}
      <Card style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Fecha", "Tipo", "Producto", "Cantidad", "Stock anterior", "Stock posterior", "Precio ref.", "Usuario", "Observaciones"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, color: "var(--muted)", borderBottom: "2px solid var(--border)", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Cargando…</td></tr>
              )}
              {!isLoading && movimientos.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No hay movimientos para los filtros seleccionados</td></tr>
              )}
              {movimientos.map(m => (
                <tr key={m.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "9px 12px", color: "var(--muted)", whiteSpace: "nowrap", fontSize: 12 }}>
                    {fmtFecha(m.fecha)}
                  </td>
                  <td style={{ padding: "9px 12px" }}>
                    <Badge color={m.tipo === "VENTA" ? "orange" : m.tipo === "INGRESO" ? "green" : "gray"}>
                      {m.tipo === "VENTA" ? "Venta" : m.tipo === "INGRESO" ? "Ingreso" : "Ajuste"}
                    </Badge>
                  </td>
                  <td style={{ padding: "9px 12px", fontWeight: 500 }}>
                    {m.producto?.nombre}
                  </td>
                  <td style={{ padding: "9px 12px", fontWeight: 500, color: m.cantidad > 0 ? "var(--green)" : "var(--danger)" }}>
                    {m.cantidad > 0 ? "+" : ""}{m.cantidad}
                  </td>
                  <td style={{ padding: "9px 12px", color: "var(--muted)" }}>
                    {m.stockAnterior}
                  </td>
                  <td style={{ padding: "9px 12px", fontWeight: 500 }}>
                    {m.stockPosterior}
                  </td>
                  <td style={{ padding: "9px 12px", color: "var(--muted)" }}>
                    {m.precioReferencia ? fmt(m.precioReferencia) : "—"}
                  </td>
                  <td style={{ padding: "9px 12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {m.usuario?.nombre}
                  </td>
                  <td style={{ padding: "9px 12px", color: "var(--muted)", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.observaciones || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Paginación ── */}
        {totalPaginas > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--card)", cursor: pagina === 1 ? "not-allowed" : "pointer", opacity: pagina === 1 ? 0.5 : 1, fontSize: 13 }}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--card)", cursor: pagina === totalPaginas ? "not-allowed" : "pointer", opacity: pagina === totalPaginas ? 0.5 : 1, fontSize: 13 }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </Card>
    </Layout>
  );
}