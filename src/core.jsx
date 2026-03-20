// ═══════════════════════════════════════════════════════════════
// SCSTix EPOS — CORE DATA, UTILITIES & SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

export { 
  PRODUCT_IMAGES, INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_ORDERS, 
  INITIAL_RETURNS, INITIAL_BANNERS, INITIAL_COUPONS, INITIAL_COUNTERS, 
  INITIAL_SETTINGS, INITIAL_PARKED, CATEGORIES, TIER_CONFIG 
} from '@/lib/seed-data'

export { THEMES } from '@/lib/theme'

export const getTier = (spent) => {
  if (spent >= 1500) return "Gold";
  if (spent >= 500) return "Silver";
  return "Bronze";
};

export const fmt = (n, sym = "£") => `${sym}${Number(n || 0).toFixed(2)}`;
export const ts = () => new Date().toLocaleString("en-GB", { hour12: false }).replace(",", "");
export const genId = (p) => `${p}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
export const isBannerActive = (b) => {
  const now = new Date();
  const s = new Date(b.startDate); const e = new Date(b.endDate);
  return b.active && now >= s && now <= e;
};

// ─── NOTIFICATION ────────────────────────────────────────────────────────────
let _notif = null;
export const notify = (msg, type = "info", duration = 4000) => _notif && _notif(msg, type, duration);

import { useState, useEffect } from "react";

export const NotificationCenter = ({ t }) => {
  const [ns, setNs] = useState([]);
  useEffect(() => {
    _notif = (msg, type, dur = 4000) => {
      const id = Date.now() + Math.random();
      setNs(n => [{ id, msg, type }, ...n.slice(0, 5)]);
      setTimeout(() => setNs(n => n.filter(x => x.id !== id)), dur);
    };
  }, []);
  const cfg = { success: [t.green, t.greenBg, t.greenBorder, "✓"], error: [t.red, t.redBg, t.redBorder, "✕"], warning: [t.yellow, t.yellowBg, t.yellowBorder, "⚠"], info: [t.blue, t.blueBg, t.blueBorder, "ℹ"] };
  return (
    <div style={{ position: "fixed", top: 60, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, width: 320, pointerEvents: "none" }}>
      {ns.map(n => {
        const [c, bg, bdr, ic] = cfg[n.type] || cfg.info; return (
          <div key={n.id} style={{ background: bg, border: `1px solid ${bdr}`, borderLeft: `4px solid ${c}`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", animation: "slideInRight 0.25s ease", pointerEvents: "auto" }}>
            <span style={{ color: c, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{ic}</span>
            <span style={{ fontSize: 13, color: t.text, fontWeight: 500, flex: 1, lineHeight: 1.4 }}>{n.msg}</span>
            <button onClick={() => setNs(x => x.filter(i => i.id !== n.id))} style={{ background: "none", border: "none", color: t.text3, cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
};

export { Btn, Input, Select, Toggle, Badge, Card, StatCard, Modal, Table, ProductCard } from '@/components/ui'

export const Sidebar = ({ user, activeSection, setActiveSection, onLogout, t }) => {
  if (!user) return null;
  const theme = t;
  const navByRole = {
    admin: [{ key: "dashboard", l: "Dashboard", i: "📊" }, { key: "analytics", l: "Analytics", i: "📈" }, { key: "customers", l: "Customers", i: "👥" }, { key: "users", l: "All Users", i: "🔑" }, { key: "staff", l: "Staff Mgmt", i: "👥" }, { key: "audit", l: "Audit Logs", i: "📋" }, { key: "banners", l: "Banners", i: "🖼️" }, { key: "coupons", l: "Coupons", i: "🎟️" }, { key: "zreport", l: "Z-Report", i: "📑" }, { key: "settings", l: "Settings", i: "⚙️" }],
    manager: [{ key: "dashboard", l: "Dashboard", i: "📊" }, { key: "staffdash", l: "Staff Dashboard", i: "🖥️" }, { key: "pickup", l: "Pickup Orders", i: "📦" }, { key: "products", l: "Products", i: "🏷️" }, { key: "inventory", l: "Inventory", i: "📦" }, { key: "staff", l: "Staff Mgmt", i: "👥" }, { key: "cashiers", l: "Cashier Mgmt", i: "🛒" }, { key: "counters", l: "Counters", i: "🏪" }, { key: "returns", l: "Returns", i: "↩️" }, { key: "reports", l: "Reports", i: "📈" }],
    cashier: [{ key: "pos", l: "POS Terminal", i: "🛒" }, { key: "orders", l: "My Orders", i: "🧾" }, { key: "returns", l: "Returns", i: "↩️" }, { key: "pickup", l: "Pickup Orders", i: "📦" }, { key: "hardware", l: "Hardware", i: "🖨️" }, { key: "profile", l: "Profile", i: "👤" }],
    staff: [{ key: "staffdash", l: "Order Queue", i: "📋" }, { key: "pickup", l: "Pickup Verify", i: "📦" }, { key: "profile", l: "Profile", i: "👤" }],
    customer: [{ key: "shop", l: "Shop", i: "🛍️" }, { key: "history", l: "My Orders", i: "📜" }, { key: "tracking", l: "Track Orders", i: "📍" }, { key: "returns", l: "Returns", i: "↩️" }, { key: "profile", l: "Profile", i: "👤" }],
  };
  const role = user.role || "customer";
  const nav = navByRole[role] || [];
  const rc = { admin: theme.red, manager: theme.yellow, cashier: theme.green, customer: theme.blue, staff: theme.teal };
  const col = rc[role] || theme.accent;
  const tierC = { Bronze: "#cd7f32", Silver: "#9ca3af", Gold: "#f59e0b" };
  return (
    <div style={{ width: "100%", height: "100%", background: theme.sidebar, borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", boxShadow: theme.shadowMd }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, background: `linear-gradient(135deg,${theme.accent},${theme.accent2})`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff", flexShrink: 0 }}>S</div>
          <div><div style={{ fontSize: 13, fontWeight: 900, color: theme.text, letterSpacing: -0.3 }}>SCSTix</div><div style={{ fontSize: 10, color: theme.text4, fontWeight: 600 }}>EPOS v1.0</div></div>
        </div>
      </div>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 38, height: 38, background: col + "20", border: `2px solid ${col}50`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: col, flexShrink: 0 }}>{user.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: 10, color: col, textTransform: "capitalize", fontWeight: 700 }}>{user.role}</div>
          </div>
        </div>
        {user.role === "customer" && (
          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
            <div style={{ flex: 1, background: tierC[user.tier] + "20", border: `1px solid ${tierC[user.tier]}40`, borderRadius: 7, padding: "4px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: theme.text3, fontWeight: 700 }}>TIER</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: tierC[user.tier] }}>{user.tier === "Gold" ? "🥇" : user.tier === "Silver" ? "🥈" : "🥉"} {user.tier}</div>
            </div>
            <div style={{ flex: 1, background: theme.yellowBg, border: `1px solid ${theme.yellowBorder}`, borderRadius: 7, padding: "4px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: theme.text3, fontWeight: 700 }}>POINTS</div>
              <div style={{ fontSize: 11, fontWeight: 900, color: theme.yellow }}>⭐{user.loyaltyPoints || 0}</div>
            </div>
          </div>
        )}
        {user.counter && <div style={{ marginTop: 6, fontSize: 10, color: theme.text3, background: theme.bg3, padding: "3px 8px", borderRadius: 6, display: "inline-block" }}>📍{user.counter}</div>}
      </div>
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {nav.map(item => (
          <button key={item.key} onClick={() => setActiveSection(item.key)}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 9, border: activeSection === item.key ? `1px solid ${col}35` : "1px solid transparent", background: activeSection === item.key ? col + "15" : "transparent", color: activeSection === item.key ? col : theme.text3, cursor: "pointer", marginBottom: 2, textAlign: "left", fontWeight: activeSection === item.key ? 800 : 500, fontSize: 12, transition: "all 0.12s", fontFamily: "inherit" }}>
            <span style={{ fontSize: 14 }}>{item.i}</span>{item.l}
          </button>
        ))}
      </nav>
      <div style={{ padding: "8px 8px", borderTop: `1px solid ${theme.border}` }}>
        <button onClick={() => setActiveSection("profile")} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 9, border: "none", background: "transparent", color: theme.text3, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit", marginBottom: 4 }}>
          👤 My Profile
        </button>
        <button onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 9, border: "none", background: "transparent", color: theme.red, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
};
