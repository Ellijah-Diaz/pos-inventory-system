<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $completed = fn () => Sale::where('status', 'completed');

        // --- Revenue trend: last 7 days (fill gaps with 0) ---
        $rows = $completed()
            ->where('created_at', '>=', today()->subDays(6))
            ->selectRaw('DATE(created_at) as d, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('d')->pluck('revenue', 'd');

        $trend = collect(range(6, 0))->map(function ($daysAgo) use ($rows) {
            $date = today()->subDays($daysAgo);
            return [
                'label'   => $date->format('D'),
                'date'    => $date->toDateString(),
                'revenue' => round((float) ($rows[$date->toDateString()] ?? 0), 2),
            ];
        })->values();

        // --- Top products (last 30 days, by quantity sold) ---
        $topProducts = SaleItem::query()
            ->whereHas('sale', fn ($q) => $q->where('status', 'completed')
                ->where('created_at', '>=', today()->subDays(30)))
            ->selectRaw('product_name, SUM(quantity) as qty, SUM(subtotal) as revenue')
            ->groupBy('product_name')
            ->orderByDesc('qty')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'today_revenue'      => round((float) $completed()->whereDate('created_at', today())->sum('total'), 2),
                'today_transactions' => $completed()->whereDate('created_at', today())->count(),
                'month_revenue'      => round((float) $completed()->whereMonth('created_at', now()->month)
                                                ->whereYear('created_at', now()->year)->sum('total'), 2),
                'total_products'     => Product::count(),
                'low_stock'          => Product::active()->lowStock()->count(),
            ],
            'trend'       => $trend,
            'topProducts' => $topProducts,
            'lowStock'    => Product::active()->lowStock()
                ->orderBy('stock_quantity')
                ->get(['id', 'name', 'sku', 'stock_quantity', 'unit', 'reorder_level']),
            'recentSales' => Sale::with('user:id,name')
                ->latest()->limit(5)
                ->get(['id', 'invoice_number', 'total', 'payment_method', 'user_id', 'created_at']),
        ]);
    }
}
