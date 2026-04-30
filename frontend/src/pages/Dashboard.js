import { api, getAnalytics } from "../api";
import { useFetch } from "../hooks/useFetch";
import { StatCard, Spinner, Empty } from "../components/UI";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const { data: inventory, loading } = useFetch(() => api.get("/inventory"));
  const { data: alerts } = useFetch(() => api.get("/alerts"));
  const { data: analytics } = useFetch(
    () => inventory ? getAnalytics(inventory) : Promise.resolve([]),
    [inventory]
  );

  if (loading) return <Spinner />;
  if (!inventory) return <Empty />;

  const lowCount = inventory.filter((i) => i.quantity <= i.minQuantity).length;
  const deadCount = inventory.filter((i) => (i.dailySales || []).slice(-14).every((v) => v === 0)).length;
  const urgent = analytics?.filter((a) => a.classification === "urgent") || [];

  const top10 = [...inventory]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map((i) => ({ name: i.itemName.slice(0, 12), quantity: i.quantity }));

  // Last 7 days movement: sum dailySales across all items per day
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const dayLabel = `Day ${i + 1}`;
    const total = inventory.reduce((s, item) => {
      const idx = (item.dailySales?.length || 0) - 7 + i;
      return s + (item.dailySales?.[idx] || 0);
    }, 0);
    return { day: dayLabel, sales: total };
  });

  return (
    <div className="p-6 space-y-6">
      {urgent.length > 0 && (
        <div className="bg-red-100 border border-red-300 text-red-800 rounded-lg px-4 py-3 text-sm">
          ⚠️ {urgent.length} item(s) will run out of stock within 7 days!
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={inventory.length} color="blue" />
        <StatCard label="Low Stock" value={lowCount} color="yellow" />
        <StatCard label="Dead Stock" value={deadCount} color="gray" />
        <StatCard label="Unresolved Alerts" value={alerts?.length ?? 0} color="red" />
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
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
