import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from stock_analysis import analyze_stock

def make_item(**kwargs):
    base = {
        "inventoryId": 1,
        "itemName": "Test Item",
        "currentQuantity": 50,
        "minQuantity": 20,
        "totalSold": 60,
        "salesDays": 20,
        "vendorLeadTimeDays": 7,
    }
    base.update(kwargs)
    return base


# 1. Urgent: 3 days to stockout with 7-day lead time
def test_urgent_classification():
    # avg_daily = 21/30 = 0.7, days_to_stockout = 3/0.7 ≈ 4.3 <= 7 lead
    item = make_item(currentQuantity=3, totalSold=21, salesDays=21, vendorLeadTimeDays=7)
    results, skipped = analyze_stock([item], period_days=30)
    assert len(results) == 1
    assert results[0]["stockStatus"] == "urgent"
    assert skipped == []


# 2. Dead stock: totalSold = 0
def test_dead_stock_classification():
    item = make_item(totalSold=0, salesDays=0)
    results, skipped = analyze_stock([item], period_days=30)
    assert results[0]["stockStatus"] == "dead_stock"
    assert results[0]["recommendedOrderQty"] == 0
    assert results[0]["avgDailySales"] == 0.0


# 3. Overstock: 200 qty, avg daily sales = 1 (30 sold in 30 days)
def test_overstock_classification():
    # avg = 30/30 = 1.0, overstock if qty > avg * 60 = 60 → 200 > 60 ✓
    item = make_item(currentQuantity=200, totalSold=30, salesDays=30, minQuantity=10)
    results, skipped = analyze_stock([item], period_days=30)
    assert results[0]["stockStatus"] == "overstock"


# 4. Recommended order quantity formula verification
def test_recommended_order_qty():
    # avg_daily = 60/30 = 2.0
    # lead = 7, safe_lead = 7
    # safety_stock = ceil(2.0 * 7 * 0.5) = ceil(7) = 7
    # lead_time_demand = 2.0 * 7 = 14
    # current_qty = 5 < 14, so reorder = ceil(14 + 7 - 5) = ceil(16) = 16
    item = make_item(currentQuantity=5, totalSold=60, salesDays=30, vendorLeadTimeDays=7, minQuantity=10)
    results, _ = analyze_stock([item], period_days=30)
    assert results[0]["avgDailySales"] == 2.0
    assert results[0]["safetyStock"] == 7
    assert results[0]["recommendedOrderQty"] == 16


# 5. Missing required fields → item appears in skipped array
def test_missing_fields_go_to_skipped():
    bad_item = {"inventoryId": 99, "itemName": "Broken Item"}  # missing quantity, totalSold, etc.
    results, skipped = analyze_stock([bad_item], period_days=30)
    assert results == []
    assert len(skipped) == 1
    assert skipped[0]["item"] == "Broken Item"
    assert "Missing fields" in skipped[0]["reason"]
