// src/pages/reportes/Reportes.js
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../../components/layout/Layout";
import { Card, MetricCard } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { reporteService } from "../../services/reporteService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid, Legend,
} from "recharts";

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-AR");
}

const TABS = ["Ventas", "Ganancias", "Rankings"];

export function Reportes() {
  const [tab, setTab]       = useState("Ventas");
  const [periodo, setPeriodo] = useState("mes");

  const { data: ventas, isLoading: loadingVentas } = useQuery({
    queryKey: ["reporte-ventas", periodo],
    queryFn:  () => reporteService.ventas({ periodo }),
  });

  const { data: ganancias, isLoading: loadingGanancias } = useQuery({
    queryKey: ["reporte-ganancias", periodo],
    queryFn:  () => reporteService.ganancias({ periodo }),
  });

  const { data: rankingU } = useQuery({
    queryKey: ["ranking", "unidades", periodo],
    queryFn:  () => reporteService.ranking({ tipo: "unidades", periodo, limit: 10 }),
  });

  const { data: rankingF } = useQuery({
    queryKey: ["ranking", "facturacion", periodo],
    queryFn:  () => reporteService.ranking({ tipo: "facturacion", periodo, limit: 10 }),
  });

  const { data: rankingG } = useQuery({
    queryKey: ["ranking", "ganancia", periodo],
    queryFn:  () => reporteService.ranking({ tipo: "ganancia", periodo, limit: 10 }),
  });

  const selectStyle = {
    padding: "7px 10px", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", fontSize: 13,
    fontFamily: "inherit", background: "var(--card)",
  };

  return (
    <Layout titulo="Reportes y análisis">

      {/* ── Tabs + selector período ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
          {TABS.map(t => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 18px", fontSize: 13, cursor: "pointer",
                color: tab === t ? "var(--green)" : "var(--muted)",
                borderBottom: tab === t ? "2px solid var(--green)" : "2px solid transparent",
                marginBottom: -2, fontWeight: tab === t ? 500 : 400,
                transition: "all .15s",
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <select style={selectStyle} value={periodo} onChange={e => setPeriodo(e.target.value)}>
          <option value="dia">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
        </select>
      </div>

      {/* ── TAB VENTAS ── */}
      {tab === "Ventas" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
            <MetricCard label="Total ventas" value={loadingVentas ? "…" : fmt(ventas?.totalVentas)} color="var(--green)" />
            <MetricCard label="Transacciones" value={loadingVentas ? "…" : ventas?.transacciones} />
            <MetricCard
              label="Ticket promedio"
              value={loadingVentas ? "…" : fmt(ventas?.transacciones ? ventas.totalVentas / ventas.transacciones : 0)}
            />
            <MetricCard label="Ganancia total" value={loadingVentas ? "…" : fmt(ventas?.totalGanancia)} color="var(--green)" />
          </div>
          <Card>
            <div style={{ fontWeight: 500, marginBottom: 14 }}>Ventas por día</div>
            {ventas?.porDia?.length === 0
              ? <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Sin ventas en el período</div>
              : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ventas?.porDia || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} />
                    <Tooltip formatter={v => fmt(v)} labelFormatter={l => "Fecha: " + l} />
                    <Bar dataKey="totalVentas" name="Ventas" fill="var(--green)" radius={[4,4,0,0]} />
                    <Bar dataKey="ganancia"    name="Ganancia" fill="var(--orange)" radius={[4,4,0,0]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </>
      )}

      {/* ── TAB GANANCIAS ── */}
      {tab === "Ganancias" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 16 }}>
            <MetricCard label="Ganancia bruta" value={loadingGanancias ? "…" : fmt(ganancias?.totales?.ganancia)} color="var(--green)" />
            <MetricCard label="Facturación total" value={loadingGanancias ? "…" : fmt(ganancias?.totales?.facturacion)} />
            <MetricCard
              label="Margen promedio"
              value={loadingGanancias ? "…" : (() => {
                const cats = ganancias?.porCategoria || [];
                if (!cats.length) return "—";
                const avg = cats.reduce((s, c) => s + Number(c.margenPromedio), 0) / cats.length;
                return avg.toFixed(1) + "%";
              })()}
              color="var(--green)"
            />
          </div>
          <Card>
            <div style={{ fontWeight: 500, marginBottom: 14 }}>Ganancia por categoría</div>
            {!ganancias?.porCategoria?.length
              ? <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Sin datos en el período</div>
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ganancias?.porCategoria || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} />
                    <YAxis type="category" dataKey="categoria" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip formatter={v => fmt(v)} />
                    <Bar dataKey="ganancia" name="Ganancia" fill="var(--green)" radius={[0,4,4,0]} />
                    <Bar dataKey="facturacion" name="Facturación" fill="var(--orange)" radius={[0,4,4,0]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }

            {/* Tabla de márgenes */}
            {ganancias?.porCategoria?.length > 0 && (
              <div style={{ marginTop: 16, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Categoría", "Transacciones", "Unidades", "Facturación", "Ganancia", "Margen"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--border)", fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ganancias.porCategoria.map(c => (
                      <tr key={c.categoria} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 500 }}>{c.categoria}</td>
                        <td style={{ padding: "8px 10px", color: "var(--muted)" }}>{c.transacciones}</td>
                        <td style={{ padding: "8px 10px", color: "var(--muted)" }}>{c.unidades}</td>
                        <td style={{ padding: "8px 10px" }}>{fmt(c.facturacion)}</td>
                        <td style={{ padding: "8px 10px", color: "var(--green)", fontWeight: 500 }}>{fmt(c.ganancia)}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <Badge color={Number(c.margenPromedio) >= 30 ? "green" : "orange"}>
                            {Number(c.margenPromedio).toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── TAB RANKINGS ── */}
      {tab === "Rankings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { titulo: "Más vendidos",       badge: "unidades",      data: rankingU, campo: "unidades",    sufijo: " u",   color: "green"  },
            { titulo: "Mayor facturación",  badge: "facturación",   data: rankingF, campo: "facturacion", sufijo: "",     color: "orange" },
            { titulo: "Mayor ganancia",     badge: "rentabilidad",  data: rankingG, campo: "ganancia",    sufijo: "",     color: "green"  },
          ].map(({ titulo, badge, data, campo, sufijo, color }) => (
            <Card key={titulo}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 500 }}>{titulo}</span>
                <Badge color={color}>{badge}</Badge>
              </div>
              {!data?.ranking?.length && (
                <div style={{ textAlign: "center", padding: 16, color: "var(--muted)", fontSize: 13 }}>Sin datos</div>
              )}
              {data?.ranking?.map((p, i) => (
                <div key={p.productoId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: i < data.ranking.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0, fontSize: 11, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i < 2 ? "var(--orange-light)" : "var(--green-light)",
                    color: i < 2 ? "#7c3e0e" : "var(--green-dark)",
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, fontSize: 12, lineHeight: 1.3 }}>{p.nombre}</div>
                  <div style={{ fontWeight: 500, fontSize: 12, color: "var(--green)", whiteSpace: "nowrap" }}>
                    {sufijo ? p[campo] + sufijo : fmt(p[campo])}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}