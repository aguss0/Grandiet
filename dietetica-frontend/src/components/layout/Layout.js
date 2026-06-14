// src/components/layout/Layout.js
import { Sidebar } from "./Sidebar";

export function Layout({ children, titulo }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}>
        <div style={{
          background: "var(--card)", borderBottom: "1px solid var(--border)",
          padding: "0 24px", height: 52,
          display: "flex", alignItems: "center",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 16, fontWeight: 500 }}>{titulo}</span>
        </div>
        <div style={{ padding: "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}