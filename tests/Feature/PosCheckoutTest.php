<?php

use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeProduct(array $attrs = []): Product
{
    return Product::create(array_merge([
        'sku'            => 'SKU-TEST-' . fake()->unique()->numerify('####'),
        'name'           => 'Test Product',
        'cost_price'     => 10,
        'selling_price'  => 25,
        'stock_quantity' => 100,
        'reorder_level'  => 10,
        'unit'           => 'pcs',
        'is_active'      => true,
    ], $attrs));
}

it('processes a cash sale, deducts stock, and logs a movement', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $product = makeProduct(['selling_price' => 25, 'stock_quantity' => 100]);

    $this->actingAs($cashier)->post('/pos', [
        'items'          => [['product_id' => $product->id, 'quantity' => 3]],
        'discount'       => 5,
        'payment_method' => 'cash',
        'amount_paid'    => 100,
    ])->assertRedirect();

    // Sale: subtotal 75, discount 5, total 70, change 30
    $sale = Sale::first();
    expect($sale)->not->toBeNull()
        ->and((float) $sale->subtotal)->toBe(75.0)
        ->and((float) $sale->total)->toBe(70.0)
        ->and((float) $sale->change)->toBe(30.0)
        ->and($sale->items)->toHaveCount(1);

    // Stock deducted 100 -> 97, and an "out" movement recorded
    expect($product->fresh()->stock_quantity)->toBe(97);
    $movement = StockMovement::where('reference', $sale->invoice_number)->first();
    expect($movement)->not->toBeNull()
        ->and($movement->type)->toBe('out')
        ->and($movement->quantity)->toBe(-3)
        ->and($movement->stock_after)->toBe(97);
});

it('rejects a sale that exceeds available stock', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $product = makeProduct(['stock_quantity' => 2]);

    $this->actingAs($cashier)->post('/pos', [
        'items'          => [['product_id' => $product->id, 'quantity' => 5]],
        'payment_method' => 'cash',
        'amount_paid'    => 1000,
    ])->assertSessionHasErrors('items');

    // Nothing should have changed
    expect(Sale::count())->toBe(0)
        ->and($product->fresh()->stock_quantity)->toBe(2);
});

it('rejects cash payment that is less than the total', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $product = makeProduct(['selling_price' => 50, 'stock_quantity' => 10]);

    $this->actingAs($cashier)->post('/pos', [
        'items'          => [['product_id' => $product->id, 'quantity' => 2]], // total 100
        'payment_method' => 'cash',
        'amount_paid'    => 60,
    ])->assertSessionHasErrors('amount_paid');

    expect(Sale::count())->toBe(0);
});
