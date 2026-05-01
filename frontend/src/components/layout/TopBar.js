import { useState } from "react";
import { Bell, Search, X } from "lucide-react";
import { useDateRange } from "../../context/DateRangeContext";
import { useFetch } from "../../hooks/useFetch";
import { api } from "../../api";

const PERIODS = [
  { label: "7d",  value: "7"  },
  { label: "30d", value: "30" },
  { label: "90d", value: "90" },
];

export default function TopBar({ title }) {
  const { period, setPeriod } = useDateRange();
  const [showNotif, setShowNotif] = useState(false);
  const [search, setSearch] = useState("");
  const { data: alerts } = useFetch(() => api.get("/alerts"));
  const unread = alerts?.length || 0;

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3"
        style={{ background: "var(--color-card)", borderBottom: "1px solid #e2f5f7" }}
      >
        {/* Page title */}
        <h1 className="text-xl font-medium mr-auto" style={{ color: "var(--color-navy)" }}>
          {title}
        </h1>

        {/* Period pills */}
        <div className="flex gap-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className="px-3 py-1 text-xs rounded-full border transition-all duration-150"
              style={period === value
                ? { background: "var(--color-navy)", color: "#fff", borderColor: "var(--color-navy)" }
                : { background: "#fff", color: "var(--color-navy)", borderColor: "var(--color-teal)" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 text-sm rounded-lg border bg-white transition"
            style={{ borderColor: search ? "var(--color-teal)" : "#e2f5f7", outline: "none", width: 180 }}
            onFocus={(e) => e.target.style.borderColor = "var(--color-teal)"}
            onBlur={(e) => e.target.style.borderColor = search ? "var(--color-teal)" : "#e2f5f7"}
          />
        </div>

        {/* Notification bell */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative p-2 rounded-lg transition"
          style={{ color: "var(--color-navy)" }}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 text-xs font-bold rounded-full flex items-center justify-center"
              style={{ background: "var(--color-mint)", color: "var(--color-navy)" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </header>

      {/* Notification panel */}
      {showNotif && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setShowNotif(false)} />
          <div
            className="fixed top-0 right-0 h-full w-80 z-40 flex flex-col shadow-2xl"
            style={{ background: "var(--color-card)", borderLeft: "3px solid var(--color-teal)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h2 className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>Notifications</h2>
              <div className="flex items-center gap-3">
                <button className="text-xs" style={{ color: "var(--color-ocean)" }}>Mark all as read</button>
                <button onClick={() => setShowNotif(false)}><X size={16} className="text-gray-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(alerts || []).slice(0, 10).map((a) => (
                <div key={a.id} className="p-3 rounded-xl text-sm" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                  <p className="font-medium" style={{ color: "var(--color-navy)" }}>{a.inventory?.itemName}</p>
                  <p className="text-xs mt-0.5 text-gray-500">{a.message}</p>
                </div>
              ))}
              {!alerts?.length && (
                <p className="text-center text-sm text-gray-400 py-8">No notifications</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
