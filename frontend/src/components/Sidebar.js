import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, BarChart2, Bell } from "lucide-react";
import AlertsBadge from "./AlertsBadge";

const links = [
  { to: "/",          icon: LayoutDashboard, label: "Dashboard"  },
  { to: "/inventory", icon: Package,         label: "Inventory"  },
  { to: "/analytics", icon: BarChart2,       label: "Analytics"  },
  { to: "/alerts",    icon: Bell,            label: "Alerts"     },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col p-4 gap-2">
      <div className="flex items-center justify-between mb-6 px-2">
        <h1 className="text-lg font-bold">📦 WMS</h1>
        <AlertsBadge />
      </div>
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
              isActive ? "bg-blue-600" : "hover:bg-gray-700"
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
