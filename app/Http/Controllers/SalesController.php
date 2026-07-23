<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

    /**
     * Void a completed sale: restore stock, log the reversal, mark voided.
     * Admin-only (route middleware). The sale row is kept for the audit trail.
     */
    public function void(Request $request, Sale $sale)
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($sale, $data, $request) {
            // Re-read under lock so two admins can't void the same sale twice
            $sale = Sale::whereKey($sale->id)->lockForUpdate()->firstOrFail();

            if ($sale->status !== 'completed') {
                throw ValidationException::withMessages([
                    'sale' => 'This sale has already been voided.',
                ]);
            }

            // Return each line's quantity to stock (product may have been deleted since)
            foreach ($sale->items as $item) {
                if (! $item->product_id) {
                    continue;
                }

                $product = Product::whereKey($item->product_id)->lockForUpdate()->first();
                if (! $product) {
                    continue;
                }

                $before = $product->stock_quantity;
                $after  = $before + $item->quantity;
                $product->update(['stock_quantity' => $after]);

                StockMovement::create([
                    'product_id'   => $product->id,
                    'user_id'      => $request->user()->id,
                    'type'         => 'in',
                    'quantity'     => $item->quantity,
                    'stock_before' => $before,
                    'stock_after'  => $after,
                    'reason'       => 'Void sale',
                    'reference'    => $sale->invoice_number,
                ]);
            }

            $sale->update([
                'status'      => 'voided',
                'voided_at'   => now(),
                'voided_by'   => $request->user()->id,
                'void_reason' => $data['reason'],
            ]);
        });

        return back()->with('success', "Sale {$sale->invoice_number} voided and stock restored.");
    }

    public function show(Sale $sale)
    {
        $sale->load(['items', 'user:id,name', 'voidedBy:id,name']);

        return response()->json([
            'invoice_number' => $sale->invoice_number,
            'created_at'     => $sale->created_at->toDateTimeString(),
            'cashier'        => $sale->user?->name,
            'payment_method' => $sale->payment_method,
            'status'         => $sale->status,
            'voided_at'      => $sale->voided_at?->toDateTimeString(),
            'voided_by'      => $sale->voidedBy?->name,
            'void_reason'    => $sale->void_reason,
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
