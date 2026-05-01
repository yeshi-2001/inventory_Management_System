import { useNavigate } from "react-router-dom";
import { billing } from "../api";
import { formatLKR } from "../utils/currency";
import toast from "react-hot-toast";

export default function BillDetailPanel({ bill, onClose }) {
  const navigate = useNavigate();

  const resend = async () => {
    try {
      await billing.resendEmail(bill.id);
      toast.success("Email resent!");
    } catch {
      toast.error("Failed to resend email");
    }
  };

  const weekRange = (dateStr) => {
    const d = new Date(dateStr);
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate:   end.toISOString().split("T")[0],
    };
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="font-bold text-lg">{bill.billNumber}</p>
            <p className="text-xs text-gray-400">{new Date(bill.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-4 space-y-4 flex-1">
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span>{bill.customerName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span>{bill.customerEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${bill.status === "paid" ? "text-green-600" : "text-red-500"}`}>
                {bill.status}
              </span>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500 text-xs">
                <th className="text-left py-1">Item</th>
                <th className="text-right py-1">Qty</th>
                <th className="text-right py-1">Price</th>
                <th className="text-right py-1">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {bill.items?.map((item) => {
                const { startDate, endDate } = weekRange(bill.createdAt);
                return (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      <div>{item.itemName}</div>
                      {item.inventoryId && (
                        <button
                          onClick={() => navigate(`/analytics?itemId=${item.inventoryId}&startDate=${startDate}&endDate=${endDate}`)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          View in analytics →
                        </button>
                      )}
                    </td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">{formatLKR(item.unitPrice)}</td>
                    <td className="text-right py-2">{formatLKR(item.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right font-bold pt-3">Total</td>
                <td className="text-right font-bold pt-3 text-green-600">{formatLKR(bill.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={resend}
            className="w-full border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            📧 Resend email
          </button>
        </div>
      </div>
    </div>
  );
}
