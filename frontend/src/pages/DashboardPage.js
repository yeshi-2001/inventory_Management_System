import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ShoppingCart, Package, Bell } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { DateRangeProvider } from "../context/DateRangeContext";
import TopBar from "../components/layout/TopBar";
import SummaryCards from "../components/dashboard/SummaryCards";
import RevenueChart from "../components/dashboard/RevenueChart";
import StockStatusDonut from "../components/dashboard/StockStatusDonut";
import TopItemsChart from "../components/dashboard/TopItemsChart";
import StockThresholdChart from "../components/dashboard/StockThresholdChart";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import ActiveAlerts from "../components/dashboard/ActiveAlerts";
import PendingOffers from "../components/dashboard/PendingOffers";
import { billing } from "../api";
import { formatLKR } from "../utils/currency";
import { useFetch } from "../hooks/useFetch";

// ─── Employee dashboard (simplified) ─────────────────────────────────────────
function EmployeeDashboard() {
  const { data: summary } = useFetch(() => billing.getSummary());
  return (
    <div className="p-6 space-y-6">
      <TopBar title="Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        <div className="rounded-2xl p-5 metric-card"
          style={{ background: "var(--color-card)" }}>
          <p className="text-xs text-gray-400">Today's Revenue</p>
          <p className="text-3xl font-semibold mt-2" style={{ color: "var(--color-navy)" }}>
            {summary ? formatLKR(summary.totalRevenue) : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-1">{summary?.totalBills || 0} transactions today</p>
        </div>
        <ActiveAlerts />
      </div>
      <div className="px-6"><RecentTransactions /></div>
    </div>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
function QuickActionFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: ShoppingCart, label: "New sale",    to: "/billing"   },
    { icon: Package,      label: "Add item",    to: "/inventory" },
    { icon: Bell,         label: "View alerts", to: "/alerts"    },
  ];

  return (
    <div className="fixed bottom-6 right-6 flex flex-col-reverse items-end gap-3 z-50">
      {open && actions.map(({ icon: Icon, label, to }, i) => (
        <button
          key={label}
          onClick={() => { navigate(to); setOpen(false); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-lg transition-all"
          style={{
            background: "var(--color-ocean)",
            transform: open ? "scale(1)" : "scale(0)",
            opacity: open ? 1 : 0,
            transitionDelay: `${i * 40}ms`,
          }}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
      <button
        onClick={() => setOpen(!open)}
        className="w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-transform"
        style={{
          width: 52, height: 52,
          background: "var(--color-navy)",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        <Plus size={22} style={{ color: "var(--color-mint)" }} />
      </button>
    </div>
  );
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  return (
    <DateRangeProvider>
      <div className="flex flex-col min-h-screen" style={{ background: "var(--color-bg)" }}>
        <TopBar title="Dashboard" />

        <div className="flex-1 p-6 space-y-6 max-w-[1400px] mx-auto w-full">
          {/* Metric cards */}
          <SummaryCards />

          {/* Revenue chart — full width */}
          <RevenueChart />

          {/* Donut + Top items */}
          <div className="grid md:grid-cols-2 gap-6">
            <StockStatusDonut />
            <TopItemsChart />
          </div>

          {/* Stock threshold — full width */}
          <StockThresholdChart />

          {/* Transactions + Alerts + Offers */}
          <div className="grid md:grid-cols-2 gap-6">
            <RecentTransactions />
            <div className="flex flex-col gap-6">
              <ActiveAlerts />
              <PendingOffers />
            </div>
          </div>
        </div>

        <QuickActionFAB />
      </div>
    </DateRangeProvider>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "employee") return <EmployeeDashboard />;
  return <AdminDashboard />;
}
