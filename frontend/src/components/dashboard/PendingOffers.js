import { useFetch } from "../../hooks/useFetch";
import { formatLKR } from "../../utils/currency";
import { useNavigate } from "react-router-dom";

export default function PendingOffers() {
  const navigate = useNavigate();
  const { data: offers, loading } = useFetch(() =>
    fetch(`${process.env.REACT_APP_API_URL}/vendor/offers?status=pending`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    }).then((r) => r.json()).then((j) => j.data || [])
  );

  const count = offers?.length || 0;

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm" style={{ color: "var(--color-navy)" }}>Pending Vendor Offers</h3>
        {count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "#fff7ed", color: "#d97706" }}>
            {count}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-lg skeleton" />)}
        </div>
      ) : count === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No pending offers from vendors.</p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {offers.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl"
              style={{ background: "var(--color-bg)" }}>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>
                  {o.vendorAccount?.companyName}
                </p>
                <p className="text-xs text-gray-400">
                  {o.itemName} · {formatLKR(o.unitPrice)}
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/vendors")}
                className="text-xs px-3 py-1.5 rounded-lg text-white shrink-0 transition"
                style={{ background: "var(--color-ocean)" }}
                onMouseEnter={(e) => e.target.style.background = "var(--color-navy)"}
                onMouseLeave={(e) => e.target.style.background = "var(--color-ocean)"}
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
