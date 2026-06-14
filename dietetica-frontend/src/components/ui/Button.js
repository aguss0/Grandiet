// src/components/ui/Button.js
export function Button({ children, variant = "primary", size = "md", loading, ...props }) {
  const styles = {
    base: {
      display: "inline-flex", alignItems: "center", gap: 6,
      border: "none", borderRadius: "var(--radius)", fontFamily: "inherit",
      fontWeight: 500, cursor: props.disabled || loading ? "not-allowed" : "pointer",
      opacity: props.disabled || loading ? 0.6 : 1, transition: "opacity .15s",
    },
    variants: {
      primary:  { background: "var(--green)",  color: "#fff" },
      orange:   { background: "var(--orange)", color: "#fff" },
      ghost:    { background: "transparent", color: "var(--text)", border: "1px solid var(--border)" },
      danger:   { background: "var(--danger)", color: "#fff" },
    },
    sizes: {
      sm: { padding: "5px 10px", fontSize: 12 },
      md: { padding: "8px 16px", fontSize: 13 },
      lg: { padding: "11px 22px", fontSize: 15 },
    },
  };

  return (
    <button
      style={{ ...styles.base, ...styles.variants[variant], ...styles.sizes[size] }}
      {...props}
    >
      {loading ? "Cargando..." : children}
    </button>
  );
}