import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, BarChart2, Bell, ShoppingCart, History, Users, Store, User, FileText } from "lucide-react";
import AlertsBadge from "./AlertsBadge";
import useAuth from "../hooks/useAuth";

const NAV = {
  admin: [
    { to: "/",               icon: LayoutDashboard, label: "Dashboard"        },
    { to: "/inventory",      icon: Package,         label: "Inventory"        },
    { to: "/analytics",      icon: BarChart2,       label: "Analytics"        },
    { to: "/alerts",         icon: Bell,            label: "Alerts"           },
    { to: "/billing",        icon: ShoppingCart,    label: "POS / Billing"    },
    { to: "/billing/history",icon: History,         label: "Bill History"     },
    { to: "/admin/vendors",  icon: Store,           label: "Vendor Management"},
    { to: "/admin/users",    icon: Users,           label: "User Management"  },
  ],
  employee: [
    { to: "/billing",        icon: ShoppingCart,    label: "POS / Billing"    },
    { to: "/billing/history",icon: History,         label: "Bill History"     },
  ],
  vendor: [
    { to: "/vendor/portal",  icon: User,            label: "My Portal"        },
    { to: "/vendor/offers",  icon: FileText,        label: "My Offers"        },
  ],
};

const ROLE_BADGE = {
  admin:    "bg-purple-500 text-white",
  employee: "bg-blue-500 text-white",
  vendor:   "bg-green-500 text-white",
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col p-4 gap-1">
      <div className="flex items-center justify-between mb-6 px-2">
        <h1 className="text-lg font-bold">📦 WMS</h1>
        {user?.role === "admin" && <AlertsBadge />}
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? "bg-blue-600" : "hover:bg-gray-700"}`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="border-t border-gray-700 pt-3 mt-2">
          <div className="px-2 mb-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}>
              {user.role}
            </span>
          </div>
          <button onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition">
            🚪 Logout
          </button>
        </div>
      )}
    </aside>
  );
}
