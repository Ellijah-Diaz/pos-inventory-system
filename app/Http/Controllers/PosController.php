<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        return Inertia::render('Pos/Index', [
            'products' => Product::active()
                ->where('stock_quantity', '>', 0)
                ->with('category:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'barcode', 'selling_price', 'stock_quantity', 'unit', 'category_id', 'image']),
            'categories' => Category::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'items'               => ['required', 'array', 'min:1'],
            'items.*.product_id'  => ['required', 'exists:products,id'],
            'items.*.quantity'    => ['required', 'integer', 'min:1'],
            'discount'            => ['nullable', 'numeric', 'min:0'],
            'payment_method'      => ['required', 'in:cash,card,gcash,other'],
            'amount_paid'         => ['required', 'numeric', 'min:0'],
        ]);

        $sale = DB::transaction(function () use ($data, $request) {
            $discount = round((float) ($data['discount'] ?? 0), 2);
            $subtotal = 0;
            $lines    = [];

            // Lock each product, validate stock, and price from the DB (source of truth)
            foreach ($data['items'] as $item) {
                /** @var Product $product */
                $product = Product::whereKey($item['product_id'])->lockForUpdate()->firstOrFail();
                $qty     = (int) $item['quantity'];

                if ($qty > $product->stock_quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Not enough stock for {$product->name} (only {$product->stock_quantity} left).",
                    ]);
                }

                $lineTotal = round($product->selling_price * $qty, 2);
                $subtotal += $lineTotal;

                $lines[] = [
                    'product'  => $product,
                    'quantity' => $qty,
                    'price'    => $product->selling_price,
                    'subtotal' => $lineTotal,
                ];
            }

            if ($discount > $subtotal) {
                throw ValidationException::withMessages(['discount' => 'Discount cannot exceed the subtotal.']);
            }

            $total = round($subtotal - $discount, 2);

            // Cash must cover the total; card/gcash are treated as exact
            if ($data['payment_method'] === 'cash') {
                if ($data['amount_paid'] < $total) {
                    throw ValidationException::withMessages(['amount_paid' => 'Amount paid is less than the total.']);
                }
                $amountPaid = round((float) $data['amount_paid'], 2);
                $change     = round($amountPaid - $total, 2);
            } else {
                $amountPaid = $total;
                $change     = 0;
            }

            $sale = Sale::create([
                'invoice_number' => Sale::generateInvoiceNumber(),
                'user_id'        => $request->user()->id,
                'subtotal'       => $subtotal,
                'discount'       => $discount,
                'tax'            => 0,
                'total'          => $total,
                'amount_paid'    => $amountPaid,
                'change'         => $change,
                'payment_method' => $data['payment_method'],
                'status'         => 'completed',
            ]);

            foreach ($lines as $line) {
                /** @var Product $product */
                $product = $line['product'];

                SaleItem::create([
                    'sale_id'      => $sale->id,
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'price'        => $line['price'],
                    'quantity'     => $line['quantity'],
                    'subtotal'     => $line['subtotal'],
                ]);

                // Deduct stock + log the movement
                $before = $product->stock_quantity;
                $after  = $before - $line['quantity'];
                $product->update(['stock_quantity' => $after]);

                StockMovement::create([
                    'product_id'   => $product->id,
                    'user_id'      => $request->user()->id,
                    'type'         => 'out',
                    'quantity'     => -$line['quantity'],
                    'stock_before' => $before,
                    'stock_after'  => $after,
                    'reason'       => 'Sale',
                    'reference'    => $sale->invoice_number,
                ]);
            }

            return $sale;
        });

        // Flash a lightweight receipt payload for the frontend modal
        return back()->with('sale', $this->receiptData($sale->fresh(['items', 'user'])));
    }

    /**
     * Build the receipt payload from a completed sale.
     */
    private function receiptData(Sale $sale): array
    {
        return [
            'invoice_number' => $sale->invoice_number,
            'created_at'     => $sale->created_at->toDateTimeString(),
            'cashier'        => $sale->user?->name,
            'payment_method' => $sale->payment_method,
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
        ];
    }
}
