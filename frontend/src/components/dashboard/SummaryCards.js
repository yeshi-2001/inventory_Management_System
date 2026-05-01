import { DollarSign, AlertTriangle, TrendingUp, Archive, Package, CheckCircle, XCircle, Store, Clock, Receipt } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { api, billing } from "../../api";
import { formatLKR } from "../../utils/currency";
import SkeletonCard from "../ui/SkeletonCard";

const GrowthBadge = ({ value, neutral }) => {
  if (neutral) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">—</span>;
  const pos = value >= 0;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: pos ? "#e6fdf8" : "#fef2f2", color: pos ? "#0f6e56" : "#991b1b" }}>
      {pos ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
};

const IconCircle = ({ bg, color, icon: Icon }) => (
  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
    <Icon size={16} style={{ color }} />
  </div>
);

function LargeCard({ label, value, sub, icon, iconBg, iconColor, growth, neutralBadge, leftBorder }) {
  return (
    <div className="metric-card rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "var(--color-card)", borderLeft: leftBorder }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <IconCircle bg={iconBg} color={iconColor} icon={icon} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold" style={{ color: "var(--color-navy)" }}>{value ?? "—"}</span>
        <GrowthBadge value={growth} neutral={neutralBadge} />
      </div>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function SmallCard({ label, value, icon: Icon, valueColor }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: "var(--color-bg)", border: "1px solid #d1eff2" }}>
      <Icon size={16} style={{ color: "var(--color-ocean)" }} />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-semibold" style={{ color: valueColor || "var(--color-navy)" }}>{value ?? "—"}</p>
      </div>
    </div>
  );
}

export default function SummaryCards() {
  const { data: inventory, loading: invLoad } = useFetch(() => api.get("/inventory"));
  const { data: summary,   loading: sumLoad } = useFetch(() => billing.getSummary());
  const { data: vendors }                     = useFetch(() => api.get("/vendors"));
  const { data: offers }                      = useFetch(() =>
    fetch(`${process.env.REACT_APP_API_URL}/vendor/offers?status=pending`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then((r) => r.json()).then((j) => j.data || [])
  );

  if (invLoad || sumLoad) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} height="h-36" />)}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => <SkeletonCard key={i} height="h-20" />)}
      </div>
    </div>
  );

  const items      = inventory || [];
  const totalValue = items.reduce((s, i) => s + (i.quantity * Number(i.unitPrice || 0)), 0);
  const lowCount   = items.filter((i) => i.quantity > 0 && i.quantity <= i.minQuantity).length;
  const outCount   = items.filter((i) => i.quantity === 0).length;
  const deadCount  = items.filter((i) => (i.dailySales || []).slice(-14).every((d) => (d.quantitySold ?? d) === 0)).length;
  const inStock    = items.filter((i) => i.quantity > i.minQuantity).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <LargeCard label="Total Inventory Value"  value={formatLKR(totalValue)}
          sub={`Across ${items.length} products`}
          icon={DollarSign} iconBg="#e8f7f8" iconColor="var(--color-ocean)" growth={5} />
        <LargeCard label="Low Stock Alerts"       value={lowCount}
          sub="Requires reorder"
          icon={AlertTriangle} iconBg="#fff7ed" iconColor="#d97706" growth={-2}
          leftBorder={lowCount > 0 ? "3px solid #f59e0b" : undefined} />
        <LargeCard label="Today's Sales Revenue"  value={summary ? formatLKR(summary.totalRevenue) : "Rs. 0.00"}
          sub={`From ${summary?.totalBills || 0} transactions today`}
          icon={TrendingUp} iconBg="rgba(93,248,216,0.15)" iconColor="var(--color-navy)" growth={12} />
        <LargeCard label="Dead Stock Items"       value={deadCount}
          sub="No movement in 30 days"
          icon={Archive} iconBg="#f3f4f6" iconColor="#6b7280" neutralBadge />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <SmallCard label="Total Items"      value={items.length}           icon={Package}      />
        <SmallCard label="In Stock"         value={inStock}                icon={CheckCircle}  valueColor="var(--color-ocean)" />
        <SmallCard label="Out of Stock"     value={outCount}               icon={XCircle}      valueColor="#dc2626" />
        <SmallCard label="Bills This Month" value={summary?.totalBills||0} icon={Receipt}      />
        <SmallCard label="Total Vendors"    value={vendors?.length||0}     icon={Store}        />
        <SmallCard label="Pending Offers"   value={offers?.length||0}      icon={Clock}        valueColor="#d97706" />
      </div>
    </div>
  );
}
