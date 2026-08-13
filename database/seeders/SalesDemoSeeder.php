<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalesDemoSeeder extends Seeder
{
    /**
     * How far back to seed — and, not by coincidence, the window the dashboard
     * chart reports on. The two have to agree or the chart opens empty.
     */
    private const DAYS = 7;

    /**
     * Generate sample completed sales across the last 7 days
     * so the dashboard and reports have data to display.
     */
    public function run(): void
    {
        // Only skip once the *demo window* already has a meaningful history;
        // this keeps any real sales you've made and just enriches the demo.
        //
        // Counting every sale ever made was wrong. The dashboard and the
        // revenue chart only look back seven days, so a store with a hundred
        // sales from last month still opens on an empty chart and ₱0.00 —
        // and the old guard skipped seeding in exactly that case, which is
        // the one case where seeding is the whole point.
        if (Sale::where('created_at', '>=', now()->subDays(self::DAYS))->count() > 10) {
            $this->command?->warn('Enough recent sales already exist — skipping demo seeding.');

            return;
        }

        $cashier  = User::where('role', 'cashier')->first() ?? User::first();
        $products = Product::where('stock_quantity', '>', 5)->get();

        if ($products->isEmpty()) {
            $this->command?->warn('No products with stock — run DatabaseSeeder first.');
            return;
        }

        // 2–4 sales per day for the past week
        for ($daysAgo = self::DAYS - 1; $daysAgo >= 0; $daysAgo--) {
            $salesToday = rand(2, 4);

            for ($n = 0; $n < $salesToday; $n++) {
                $when = now()->subDays($daysAgo)
                    ->setTime(rand(9, 19), rand(0, 59), rand(0, 59));

                DB::transaction(function () use ($products, $cashier, $when) {
                    $picks    = $products->random(rand(1, 3));
                    $subtotal = 0;
                    $lines    = [];

                    foreach ($picks as $product) {
                        $qty = rand(1, 3);
                        if ($qty > $product->stock_quantity) {
                            $qty = 1;
                        }
                        $lineTotal = round($product->selling_price * $qty, 2);
                        $subtotal += $lineTotal;
                        $lines[] = compact('product', 'qty', 'lineTotal');
                    }

                    $discount   = rand(0, 4) === 0 ? round($subtotal * 0.05, 2) : 0; // occasional 5% off
                    $total      = round($subtotal - $discount, 2);
                    $method     = ['cash', 'cash', 'cash', 'gcash', 'card'][rand(0, 4)];
                    $amountPaid = $method === 'cash' ? ceil($total / 50) * 50 : $total;

                    $sale = Sale::create([
                        'invoice_number' => Sale::generateInvoiceNumber(),
                        'user_id'        => $cashier->id,
                        'subtotal'       => $subtotal,
                        'discount'       => $discount,
                        'tax'            => 0,
                        'total'          => $total,
                        'amount_paid'    => $amountPaid,
                        'change'         => round($amountPaid - $total, 2),
                        'payment_method' => $method,
                        'status'         => 'completed',
                        'created_at'     => $when,
                        'updated_at'     => $when,
                    ]);

                    foreach ($lines as $line) {
                        /** @var Product $product */
                        $product = $line['product'];

                        SaleItem::create([
                            'sale_id'      => $sale->id,
                            'product_id'   => $product->id,
                            'product_name' => $product->name,
                            'price'        => $product->selling_price,
                            'quantity'     => $line['qty'],
                            'subtotal'     => $line['lineTotal'],
                            'created_at'   => $when,
                            'updated_at'   => $when,
                        ]);

                        $before = $product->stock_quantity;
                        $after  = $before - $line['qty'];
                        $product->update(['stock_quantity' => $after]);

                        StockMovement::create([
                            'product_id'   => $product->id,
                            'user_id'      => $cashier->id,
                            'type'         => 'out',
                            'quantity'     => -$line['qty'],
                            'stock_before' => $before,
                            'stock_after'  => $after,
                            'reason'       => 'Sale',
                            'reference'    => $sale->invoice_number,
                            'created_at'   => $when,
                            'updated_at'   => $when,
                        ]);
                    }
                });
            }
        }

        $this->command?->info('Demo sales created: ' . Sale::count());
    }
}
