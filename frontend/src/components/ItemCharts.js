import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, defs, linearGradient, stop,
} from "recharts";

const fmt = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default function ItemCharts({ inventoryId, minQuantity, chartData }) {
  const data = chartData?.[inventoryId];
  if (!data) return <p className="text-sm text-gray-400 py-4 text-center">Loading charts...</p>;

  const { salesTrend, stockLevel } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl">
      {/* Chart A — Sales Trend */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Daily Sales</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={salesTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v) => [v, "Units sold"]}
              labelFormatter={(l) => `Date: ${l}`}
            />
            <Bar dataKey="sold" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart B — Stock Level Over Time */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Stock Level</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={stockLevel} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${inventoryId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              formatter={(v) => [v, "Units in stock"]}
              labelFormatter={(l) => `Date: ${l}`}
            />
            <ReferenceLine
              y={minQuantity}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: "Min level", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
            />
            <Area
              type="monotone"
              dataKey="quantity"
              stroke="#16a34a"
              fill={`url(#grad-${inventoryId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
