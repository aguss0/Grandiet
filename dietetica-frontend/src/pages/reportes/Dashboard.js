// src/pages/reportes/Dashboard.js
import { useQuery } from "@tanstack/react-query";
import { Layout } from "../../components/layout/Layout";
import { Card, MetricCard } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { reporteService } from "../../services/reporteService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#2d7a3e", "#4a9e5c", "#e07b2a", "#f0944d", "#888", "#ccc"];

const ventasSemana = [
  { dia: "Lun", ventas: 22000 },
  { dia: "Mar", ventas: 28000 },
  { dia: "Mié", ventas: 19000 },
  { dia: "Jue", ventas: 35000 },
  { dia: "Vie", ventas: 42000 },
  { dia: "Sáb", ventas: 24000 },
  { dia: "Dom", ventas: 14000 },
];

const categoriaData = [
  { name: "Frutos secos", value: 28 },
  { name: "Harinas",      value: 22 },
  { name: "Semillas",     value: 18 },
  { name: "Cereales",     value: 15 },
  { name: "Infusiones",   value: 10 },
  { name: "Otros",        value: 7  },
];

function fmt(n) {
  return "$" + Number(n || 0).toLocaleString("es-AR");
}

export function Dashboard() {
  const { data: resumen, isLoading } = useQuery({
    queryKey: ["resumen"],
    queryFn:  reporteService.resumen,
  });

  const { data: rankingUnidades } = useQuery({
    queryKey: ["ranking", "unidades"],
    queryFn:  () => reporteService.ranking({ tipo: "unidades", limit: 5 }),
  });

  const { data: rankingGanancia } = useQuery({
    queryKey: ["ranking", "ganancia"],
    queryFn:  () => reporteService.ranking({ tipo: "ganancia", limit: 5 }),
  });

  const { data: alertas } = useQuery({
    queryKey: ["alertas"],
    queryFn:  reporteService.alertas,
  });

  return (
    <Layout titulo="Dashboard">

      {/* ── Métricas principales ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <MetricCard
          label="Ventas esta semana"
          value={isLoading ? "..." : fmt(resumen?.ventasSemana?.total)}
          delta={`${resumen?.ventasSemana?.transacciones || 0} transacciones`}
          color="var(--green)"
        />
        <MetricCard
          label="Ganancia del mes"
          value={isLoading ? "..." : fmt(resumen?.gananciaMes)}
          color="var(--green)"
        />
        <MetricCard
          label="Stock bajo"
          value={isLoading ? "..." : resumen?.productosStockBajo}
          delta="productos bajo mínimo"
          color="var(--orange)"
        />
        <MetricCard
          label="Movimientos hoy"
          value={isLoading ? "..." : resumen?.movimientosHoy}
        />
        <MetricCard
          label="Sin movimiento"
          value={isLoading ? "..." : resumen?.sinMovimiento30dias}
          delta="+30 días sin ventas"
          color="var(--danger)"
        />
      </div>

      {/* ── Gráficos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Ventas por día (última semana)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ventasSemana}>
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "$" + v / 1000 + "k"} />
              <Tooltip formatter={v => fmt(v)} />
              <Bar dataKey="ventas" fill="var(--green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Ventas por categoría</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoriaData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {categoriaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip formatter={v => v + "%"} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Rankings ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 500 }}>Top 5 más vendidos</span>
            <Badge color="green">unidades</Badge>
          </div>
          {rankingUnidades?.ranking?.map((p, i) => (
            <div key={p.productoId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: i < 2 ? "var(--orange-light)" : "var(--green-light)",
                color: i < 2 ? "#7c3e0e" : "var(--green-dark)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500,
              }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{p.nombre}</div>
              <div style={{ fontWeight: 500, color: "var(--green)", fontSize: 13 }}>{p.unidades} u</div>
            </div>
          ))}
          {!rankingUnidades?.ranking?.length && (
            <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 16 }}>Sin ventas registradas</div>
          )}
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontWeight: 500 }}>Top 5 mayor ganancia</span>
            <Badge color="orange">rentabilidad</Badge>
          </div>
          {rankingGanancia?.ranking?.map((p, i) => (
            <div key={p.productoId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: i < 2 ? "var(--orange-light)" : "var(--green-light)",
                color: i < 2 ? "#7c3e0e" : "var(--green-dark)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 500,
              }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13 }}>{p.nombre}</div>
              <div style={{ fontWeight: 500, color: "var(--green)", fontSize: 13 }}>{fmt(p.ganancia)}</div>
            </div>
          ))}
          {!rankingGanancia?.ranking?.length && (
            <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 16 }}>Sin ventas registradas</div>
          )}
        </Card>
      </div>

      {/* ── Alertas ── */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontWeight: 500 }}>Alertas activas</span>
          <Badge color="red">
            {((alertas?.stockBajo?.length || 0) + (alertas?.sinMovimiento?.length || 0))} alertas
          </Badge>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Stock bajo
            </div>
            {alertas?.stockBajo?.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>✅ Sin alertas de stock</div>
            )}
            {alertas?.stockBajo?.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#fef9c3", borderLeft: "3px solid var(--warn)", borderRadius: 4, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warn)", flexShrink: 0 }} />
                <div style={{ fontSize: 12 }}>
                  <strong>{p.nombre}</strong> — {p.stockActual} {p.unidad} (mín. {p.stockMinimo})
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Sin movimiento +30 días
            </div>
            {alertas?.sinMovimiento?.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>✅ Todos los productos activos</div>
            )}
            {alertas?.sinMovimiento?.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "#f3f4f6", borderLeft: "3px solid #9ca3af", borderRadius: 4, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#9ca3af", flexShrink: 0 }} />
                <div style={{ fontSize: 12 }}>
                  <strong>{p.nombre}</strong> — {p.diasSinMovimiento || "+"} días
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

    </Layout>
  );
}   