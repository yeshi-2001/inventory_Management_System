import { api } from "../api";
import { useFetch } from "../hooks/useFetch";
import { Spinner, Empty } from "../components/UI";

export default function Alerts() {
  const { data: alerts, loading, reload } = useFetch(() => api.get("/alerts"));

  const resolve = async (id) => {
    await api.post(`/alerts/resolve/${id}`, {});
    reload();
  };

  if (loading) return <Spinner />;
  if (!alerts?.length) return <Empty message="No unresolved alerts. All clear! ✅" />;

  const typeColor = {
    low_stock: "bg-yellow-50 border-yellow-300",
    reorder: "bg-blue-50 border-blue-300",
    expired: "bg-red-50 border-red-300",
  };

  return (
    <div className="p-6 space-y-3">
      <h2 className="text-lg font-semibold">Unresolved Alerts ({alerts.length})</h2>
      {alerts.map((alert) => (
        <div
          key={alert.alertId || alert.id}
          className={`flex items-start justify-between border rounded-xl p-4 ${typeColor[alert.alertType] || "bg-gray-50 border-gray-200"}`}
        >
          <div>
            <p className="text-sm font-medium">{alert.message}</p>
            <p className="text-xs text-gray-400 mt-1">
              {alert.alertType} · {new Date(alert.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => resolve(alert.alertId || alert.id)}
            className="text-xs bg-white border rounded px-3 py-1 hover:bg-gray-50 ml-4 shrink-0"
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}
