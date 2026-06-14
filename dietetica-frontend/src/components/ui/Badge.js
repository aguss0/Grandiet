// src/components/ui/Badge.js
const estilos = {
  green:  { background: "var(--green-light)",  color: "var(--green-dark)" },
  orange: { background: "var(--orange-light)", color: "#7c3e0e" },
  red:    { background: "#fee2e2",             color: "var(--danger)" },
  gray:   { background: "#f3f4f6",             color: "var(--muted)" },
};

export function Badge({ children, color = "green" }) {
  return (
    <span style={{
      ...estilos[color],
      fontSize: 11, padding: "2px 8px",
      borderRadius: 12, fontWeight: 500,
      display: "inline-block",
    }}>
      {children}
    </span>
  );
}