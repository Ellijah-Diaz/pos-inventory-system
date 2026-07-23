<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StockController extends Controller
{
    public function index(Request $request)
    {
        $search  = $request->string('search')->toString();
        $type    = $request->string('type')->toString();
        $product = $request->integer('product_id');

        $movements = StockMovement::query()
            ->with(['product:id,name,sku,unit', 'user:id,name'])
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($product, fn ($q) => $q->where('product_id', $product))
            ->when($search, fn ($q) => $q->whereHas('product', fn ($p) => $p
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Stock/Index', [
            'movements' => $movements,
            'products'  => Product::active()->orderBy('name')
                ->get(['id', 'name', 'sku', 'unit', 'stock_quantity']),
            'lowStock'  => Product::active()->lowStock()
                ->with('category:id,name')->orderBy('stock_quantity')
                ->get(['id', 'name', 'sku', 'unit', 'stock_quantity', 'reorder_level', 'category_id']),
            'filters'   => [
                'search'     => $search,
                'type'       => $type ?: null,
                'product_id' => $product ?: null,
            ],
            'stats'     => [
                'movements_today' => StockMovement::whereDate('created_at', today())->count(),
                'low_stock'       => Product::active()->lowStock()->count(),
                'out_of_stock'    => Product::active()->where('stock_quantity', 0)->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'type'       => ['required', 'in:in,out,adjustment'],
            'quantity'   => ['required', 'integer', 'min:0'],
            'reason'     => ['nullable', 'string', 'max:255'],
            'reference'  => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($data, $request) {
            /** @var Product $product */
            $product = Product::whereKey($data['product_id'])->lockForUpdate()->firstOrFail();

            $before = $product->stock_quantity;
            $qty    = (int) $data['quantity'];

            [$change, $after] = match ($data['type']) {
                'in'         => [$qty, $before + $qty],
                'out'        => [-$qty, $before - $qty],
                'adjustment' => [$qty - $before, $qty], // quantity = the new absolute count
            };

            // Guard: 'in' / 'out' must move a positive quantity
            if (in_array($data['type'], ['in', 'out'], true) && $qty < 1) {
                throw ValidationException::withMessages([
                    'quantity' => 'Quantity must be at least 1.',
                ]);
            }

            // Guard: can't remove more than what's on hand
            if ($after < 0) {
                throw ValidationException::withMessages([
                    'quantity' => "Cannot remove {$qty}. Only {$before} in stock.",
                ]);
            }

            $product->update(['stock_quantity' => $after]);

            StockMovement::create([
                'product_id'   => $product->id,
                'user_id'      => $request->user()->id,
                'type'         => $data['type'],
                'quantity'     => $change,
                'stock_before' => $before,
                'stock_after'  => $after,
                'reason'       => $data['reason'] ?? null,
                'reference'    => $data['reference'] ?? null,
            ]);
        });

        return back()->with('success', 'Stock updated.');
    }
}
