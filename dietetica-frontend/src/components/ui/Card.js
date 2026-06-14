// src/components/ui/Card.js
export function Card({ children, style, ...props }) {
  return (
    <div
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 10, padding: 16, ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function MetricCard({ label, value, delta, color = "var(--text)" }) {
  return (
    <Card>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
      {delta && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{delta}</div>}
    </Card>
  );
}