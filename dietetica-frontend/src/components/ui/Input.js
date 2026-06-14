// src/components/ui/Input.js
export function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: "100%", padding: "8px 10px",
          border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "var(--radius)", fontSize: 13,
          fontFamily: "inherit", outline: "none",
          background: "var(--card)",
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: "100%", padding: "8px 10px",
          border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "var(--radius)", fontSize: 13,
          fontFamily: "inherit", background: "var(--card)",
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 11, color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}