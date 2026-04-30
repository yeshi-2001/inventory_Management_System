import math

REQUIRED_FIELDS = {"inventoryId", "itemName", "currentQuantity", "minQuantity", "totalSold", "salesDays"}


def analyze_stock(items, period_days):
    results = []
    skipped = []

    for item in items:
        # ── Validate required fields ──────────────────────────────────────────
        missing = REQUIRED_FIELDS - set(item.keys())
        if missing:
            skipped.append({"item": item.get("itemName", "unknown"), "reason": f"Missing fields: {missing}"})
            continue

        try:
            inventory_id   = int(item["inventoryId"])
            item_name      = str(item["itemName"]).strip()
            current_qty    = int(item["currentQuantity"])
            min_qty        = int(item["minQuantity"])
            total_sold     = int(item["totalSold"])
            sales_days     = int(item["salesDays"])
            lead_time_days = int(item["vendorLeadTimeDays"]) if item.get("vendorLeadTimeDays") else None
        except (ValueError, TypeError) as e:
            skipped.append({"item": item.get("itemName", "unknown"), "reason": str(e)})
            continue

        lead = lead_time_days or 7
        safe_lead = lead_time_days or 3

        # 1. Average daily sales
        avg_daily_sales = round(total_sold / period_days, 2) if sales_days > 0 else 0.0

        # 2. Days to stockout
        if avg_daily_sales > 0:
            days_to_stockout = round(current_qty / avg_daily_sales, 1)
        else:
            days_to_stockout = None

        # 3. Safety stock
        safety_stock = math.ceil(avg_daily_sales * safe_lead * 0.5)

        # 4. Recommended order quantity
        if avg_daily_sales == 0:
            recommended_order_qty = 0
        else:
            lead_time_demand = avg_daily_sales * lead
            if current_qty >= lead_time_demand:
                recommended_order_qty = 0
            else:
                recommended_order_qty = math.ceil(lead_time_demand + safety_stock - current_qty)

        # 5. Stock status (strict priority order)
        if total_sold == 0:
            stock_status = "dead_stock"
        elif days_to_stockout is not None and days_to_stockout <= lead:
            stock_status = "urgent"
        elif current_qty <= min_qty:
            stock_status = "low_stock"
        elif avg_daily_sales > 0 and current_qty > (avg_daily_sales * 60):
            stock_status = "overstock"
        else:
            stock_status = "normal"

        # 6. Insight
        if stock_status == "dead_stock":
            insight = f"{item_name} has had no sales in {period_days} days — consider discounting or returning to vendor."
        elif stock_status == "urgent":
            insight = f"At current sales pace, {item_name} will run out in {days_to_stockout} days. Reorder {recommended_order_qty} units now."
        elif stock_status == "low_stock":
            insight = f"{item_name} is below minimum stock level. Reorder {recommended_order_qty} units soon."
        elif stock_status == "overstock":
            days_cover = round(current_qty / avg_daily_sales) if avg_daily_sales > 0 else "∞"
            insight = f"{item_name} has {days_cover} days of stock coverage — consider reducing future orders."
        else:
            if recommended_order_qty > 0:
                insight = f"{item_name} stock is stable with {days_to_stockout or '∞'} days of coverage. Reorder {recommended_order_qty} units when ready."
            else:
                insight = f"{item_name} stock is stable with {days_to_stockout or '∞'} days of coverage. No reorder needed."

        results.append({
            "inventoryId":         inventory_id,
            "itemName":            item_name,
            "avgDailySales":       avg_daily_sales,
            "daysToStockout":      days_to_stockout,
            "safetyStock":         safety_stock,
            "recommendedOrderQty": recommended_order_qty,
            "stockStatus":         stock_status,
            "insight":             insight,
            "totalSold":           total_sold,
            "currentQuantity":     current_qty,
            "minQuantity":         min_qty,
        })

    return results, skipped
