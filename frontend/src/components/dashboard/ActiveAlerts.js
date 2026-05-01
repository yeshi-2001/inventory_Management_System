import { useFetch } from "../../hooks/useFetch";
import { api } from "../../api";
import { AlertTriangle, Archive, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ActiveAlerts() {
  const { data: alerts, loading, reload } = useFetch(() => api.get("/alerts"));
  const count = alerts?.length || 0;

  const resolve = async (id) => {
    await api.post(`/alerts/resolve/${id}`, {});
    toast.success("Alert resolved");
    reload();
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderLeft: count > 0 ? "3px solid #f59e0b" : "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>Active Alerts</h3>
        {count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(93,248,216,0.2)", color: "var(--color-navy)" }}>
            {count}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 rounded-lg skeleton" />
          ))}
        </div>
      ) : count === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <CheckCircle size={24} style={{ color: "var(--color-teal)" }} />
          <p className="text-sm text-gray-400">All clear. No active alerts.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between gap-2 p-2.5 rounded-xl group"
              style={{ background: "var(--color-bg)" }}
            >
              <div className="flex items-start gap-2">
                {a.alertType === "dead_stock"
                  ? <Archive size={14} className="mt-0.5 shrink-0 text-gray-400" />
                  : <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                }
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>
                    {a.inventory?.itemName}
                  </p>
                  <p className="text-xs text-gray-400">{a.message}</p>
                </div>
              </div>
              <button
                onClick={() => resolve(a.id)}
                className="text-xs px-2 py-1 rounded-lg border opacity-0 group-hover:opacity-100 transition shrink-0"
                style={{ borderColor: "var(--color-teal)", color: "var(--color-ocean)" }}
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
