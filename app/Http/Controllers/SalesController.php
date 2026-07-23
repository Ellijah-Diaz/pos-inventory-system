<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $from   = $request->date('from');
        $to     = $request->date('to');

        $base = Sale::query()
            ->when($search, fn ($q) => $q->where('invoice_number', 'like', "%{$search}%"))
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to));

        $sales = (clone $base)
            ->with('user:id,name')
            ->withCount('items')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales'   => $sales,
            'filters' => [
                'search' => $search,
                'from'   => $from?->toDateString(),
                'to'     => $to?->toDateString(),
            ],
            'summary' => [
                'count'    => (clone $base)->where('status', 'completed')->count(),
                'revenue'  => round((float) (clone $base)->where('status', 'completed')->sum('total'), 2),
                'discount' => round((float) (clone $base)->where('status', 'completed')->sum('discount'), 2),
            ],
        ]);
    }

    public function show(Sale $sale)
    {
        $sale->load(['items', 'user:id,name']);

        return response()->json([
            'invoice_number' => $sale->invoice_number,
            'created_at'     => $sale->created_at->toDateTimeString(),
            'cashier'        => $sale->user?->name,
            'payment_method' => $sale->payment_method,
            'status'         => $sale->status,
            'subtotal'       => (float) $sale->subtotal,
            'discount'       => (float) $sale->discount,
            'total'          => (float) $sale->total,
            'amount_paid'    => (float) $sale->amount_paid,
            'change'         => (float) $sale->change,
            'items'          => $sale->items->map(fn ($i) => [
                'name'     => $i->product_name,
                'price'    => (float) $i->price,
                'quantity' => $i->quantity,
                'subtotal' => (float) $i->subtotal,
            ]),
        ]);
    }
}
