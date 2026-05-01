import { api, getAnalytics } from "../api";
import { useFetch } from "../hooks/useFetch";
import { StatCard, Spinner, Empty } from "../components/UI";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatLKR } from "../utils/currency";

const BASE = process.env.REACT_APP_API_URL;

export default function Dashboard() {
  const { data: inventory, loading } = useFetch(() => api.get("/inventory"));
  const { data: alerts }             = useFetch(() => api.get("/alerts"));
  const { data: analytics }          = useFetch(
    () => inventory ? getAnalytics(inventory) : Promise.resolve([]),
    [inventory]
  );
  const { data: summary }   = useFetch(() => api.get("/billing/summary"));
  const { data: salesRows } = useFetch(() =>
    fetch(`${BASE}/billing/daily-sales?days=7`)
      .then((r) => r.json())
      .then((j) => j.data || [])
  );

  if (loading) return <Spinner />;
  if (!inventory) return <Empty />;

  const lowCount = inventory.filter((i) => i.quantity <= i.minQuantity).length;
  const urgent   = analytics?.filter((a) => a.classification === "urgent") || [];

  const top10 = [...inventory]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((i) => ({ name: (i.itemName || "").slice(0, 12), quantity: i.quantity }));

  // Build last-7-days chart — fill missing dates with 0
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const row = (salesRows || []).find((r) => r.date === dateStr);
    return { day: `${d.getMonth() + 1}/${d.getDate()}`, sales: row ? Number(row.totalSold) : 0 };
  });

  return (
    <div className="p-6 space-y-6">
      {urgent.length > 0 && (
        <div className="bg-red-100 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {urgent.length} item(s) will run out of stock within 7 days!
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Items"       value={inventory.length}    color="blue"   />
        <StatCard label="Low Stock"         value={lowCount}            color="yellow" />
        <StatCard label="Unresolved Alerts" value={alerts?.length ?? 0} color="red"    />
        <StatCard
          label="Revenue Today"
          value={summary ? formatLKR(summary.totalRevenue) : "—"}
          color="blue"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-gray-600">Top 10 Items by Stock</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top10}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold mb-3 text-gray-600">Stock Movement (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => [v, "Units sold"]} />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
