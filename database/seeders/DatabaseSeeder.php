<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // --- Users -----------------------------------------------------
        // Demo credentials, published in the README and SETUP.md. They exist
        // so a clone can sign in and look around; they are not secrets and
        // nothing outside a local demo database should ever use them.
        //
        // Keep these in step with both documents. They drifted once already —
        // the README advertised logins the seeder had never created.
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'      => 'Administrator',
                'password'  => Hash::make('1234567890'),
                'role'      => 'admin',
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'cashier@gmail.com'],
            [
                'name'      => 'Cashier',
                'password'  => Hash::make('password'),
                'role'      => 'cashier',
                'is_active' => true,
            ]
        );

        // --- Categories ------------------------------------------------
        $categories = collect([
            'Beverages', 'Snacks', 'Groceries', 'Personal Care', 'Household',
        ])->mapWithKeys(fn ($name) => [
            $name => Category::updateOrCreate(['name' => $name], ['is_active' => true]),
        ]);

        // --- Suppliers -------------------------------------------------
        $supplierA = Supplier::updateOrCreate(
            ['name' => 'Metro Distribution Inc.'],
            ['contact_person' => 'Juan Dela Cruz', 'phone' => '0917-000-1111', 'email' => 'sales@metrodist.test']
        );
        $supplierB = Supplier::updateOrCreate(
            ['name' => 'Prime Goods Trading'],
            ['contact_person' => 'Maria Santos', 'phone' => '0918-222-3333', 'email' => 'orders@primegoods.test']
        );

        // --- Products --------------------------------------------------
        $products = [
            ['Beverages',     'Bottled Water 500ml',   12,   18,  120],
            ['Beverages',     'Cola 1.5L',             48,   75,   60],
            ['Beverages',     'Instant Coffee 3-in-1', 6,    9,   200],
            ['Snacks',        'Potato Chips 100g',     22,   35,   80],
            ['Snacks',        'Chocolate Bar',         18,   28,    8], // low stock demo
            ['Snacks',        'Biscuits Pack',         15,   24,   45],
            ['Groceries',     'Rice 1kg',              45,   58,   90],
            ['Groceries',     'Cooking Oil 1L',        85,  110,   30],
            ['Groceries',     'Canned Tuna 155g',      28,   42,   70],
            ['Personal Care', 'Shampoo Sachet',        6,    10,  150],
            ['Personal Care', 'Bath Soap 90g',         18,   28,   50],
            ['Household',     'Dishwashing Liquid',    35,   52,    5], // low stock demo
            ['Household',     'Laundry Powder 1kg',    75,  105,   25],
        ];

        foreach ($products as $i => [$cat, $name, $cost, $price, $stock]) {
            Product::updateOrCreate(
                ['sku' => 'SKU-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT)],
                [
                    'category_id'    => $categories[$cat]->id,
                    'supplier_id'    => $i % 2 === 0 ? $supplierA->id : $supplierB->id,
                    'barcode'        => '48' . str_pad((string) ($i + 1), 11, '0', STR_PAD_LEFT),
                    'name'           => $name,
                    'cost_price'     => $cost,
                    'selling_price'  => $price,
                    'stock_quantity' => $stock,
                    'reorder_level'  => 10,
                    'unit'           => 'pcs',
                    'is_active'      => true,
                ]
            );
        }
    }
}
