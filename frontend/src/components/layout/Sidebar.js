import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, BarChart2, ShoppingCart,
  History, Store, Users, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, Sun, Moon,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const NAV = {
  admin: [
    { to: "/",               icon: LayoutDashboard, label: "Dashboard"       },
    { to: "/inventory",      icon: Package,         label: "Inventory"       },
    { to: "/analytics",      icon: BarChart2,       label: "Stock Analytics" },
    { to: "/billing",        icon: ShoppingCart,    label: "POS Billing"     },
    { to: "/billing/history",icon: History,         label: "Billing History" },
    { to: "/admin/vendors",  icon: Store,           label: "Vendors"         },
    { to: "/alerts",         icon: Bell,            label: "Alerts"          },
    { to: "/admin/users",    icon: Users,           label: "Settings"        },
  ],
  employee: [
    { to: "/billing",        icon: ShoppingCart,    label: "POS Billing"     },
    { to: "/billing/history",icon: History,         label: "Billing History" },
    { to: "/alerts",         icon: Bell,            label: "Alerts"          },
  ],
  vendor: [
    { to: "/vendor/portal",  icon: Store,           label: "My Portal"       },
    { to: "/alerts",         icon: Bell,            label: "Alerts"          },
  ],
};

function WarehouseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 4l9 5.5V20H3V9.5z" stroke="#5DF8D8" strokeWidth="1.8" strokeLinejoin="round"/>
      <rect x="9" y="13" width="6" height="7" rx="1" stroke="#5DF8D8" strokeWidth="1.8"/>
      <path d="M12 4v3" stroke="#5DF8D8" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

export default function Sidebar({ alertCount = 0, darkMode, onToggleDark }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];

  const initials = (user?.name || "U")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => { logout(); navigate("/register"); };

  const w = collapsed ? "w-16" : "w-60";

  return (
    <aside
      className={`${w} min-h-screen flex flex-col transition-all duration-200 shrink-0`}
      style={{ background: "var(--color-navy)", borderRight: "1px solid #0f4d75" }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <WarehouseIcon />
        {!collapsed && (
          <span className="text-white font-semibold text-base tracking-wide">StockSense</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-auto mb-4 flex items-center justify-center w-7 h-7 rounded-full transition"
        style={{ color: "var(--color-teal)", background: "rgba(111,209,215,0.1)" }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {links.map(({ to, icon: Icon, label }) => {
          const isAlert = label === "Alerts";
          return (
            <NavLink
              key={to} to={to} end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative
                 ${isActive ? "nav-active text-white" : "nav-inactive text-white/65 hover:text-white"}
                 ${collapsed ? "justify-center" : ""}`
              }
              style={({ isActive }) => isActive ? {} : {}}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="flex-1">{label}</span>}
                  {isAlert && alertCount > 0 && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--color-mint)", color: "var(--color-navy)" }}
                    >
                      {alertCount}
                    </span>
                  )}
                  {isActive && !collapsed && (
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--color-mint)" }} />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Ocean theme indicator */}
      {!collapsed && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg flex items-center gap-2"
          style={{ background: "rgba(93,248,216,0.08)", border: "1px solid rgba(93,248,216,0.2)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-mint)" }} />
          <span className="text-xs" style={{ color: "var(--color-teal)" }}>Ocean theme</span>
        </div>
      )}

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="mx-3 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg transition"
        style={{ color: "var(--color-teal)", background: "rgba(111,209,215,0.08)" }}
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        {!collapsed && <span className="text-xs">{darkMode ? "Light mode" : "Dark mode"}</span>}
      </button>

      {/* User info */}
      <div
        className={`mx-2 mb-4 p-3 rounded-xl flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: "var(--color-ocean)" }}
        >
          {initials}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full capitalize"
              style={{ background: "rgba(93,248,216,0.2)", color: "var(--color-mint)" }}
            >
              {user?.role}
            </span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white/100 transition"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
