<?php

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\User;

function makeSaleWithProduct(int $qty = 2, int $stockAfterSale = 8): array
{
    $product = Product::create([
        'sku' => 'V-' . uniqid(), 'name' => 'Void Test Product', 'unit' => 'pc',
        'cost_price' => 5, 'selling_price' => 10,
        'stock_quantity' => $stockAfterSale, 'reorder_level' => 1,
    ]);

    $sale = Sale::create([
        'invoice_number' => Sale::generateInvoiceNumber(),
        'subtotal' => $qty * 10, 'discount' => 0, 'tax' => 0,
        'total' => $qty * 10, 'amount_paid' => $qty * 10, 'change' => 0,
        'payment_method' => 'cash', 'status' => 'completed',
    ]);

    SaleItem::create([
        'sale_id' => $sale->id, 'product_id' => $product->id,
        'product_name' => $product->name, 'price' => 10,
        'quantity' => $qty, 'subtotal' => $qty * 10,
    ]);

    return [$sale, $product];
}

test('an admin can void a sale, restoring stock and logging the movement', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$sale, $product] = makeSaleWithProduct(qty: 2, stockAfterSale: 8);

    $this->actingAs($admin)
        ->post(route('sales.void', $sale), ['reason' => 'Wrong order'])
        ->assertSessionHasNoErrors();

    $sale->refresh();
    expect($sale->status)->toBe('voided')
        ->and($sale->void_reason)->toBe('Wrong order')
        ->and($sale->voided_by)->toBe($admin->id)
        ->and($sale->voided_at)->not->toBeNull()
        ->and($product->fresh()->stock_quantity)->toBe(10); // 8 + 2 restored

    $movement = StockMovement::where('reference', $sale->invoice_number)->latest('id')->first();
    expect($movement)->not->toBeNull()
        ->and($movement->type)->toBe('in')
        ->and($movement->quantity)->toBe(2)
        ->and($movement->reason)->toBe('Void sale');
});

test('a voided sale is excluded from revenue summaries', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$sale] = makeSaleWithProduct(qty: 3);

    $before = $this->actingAs($admin)->get(route('sales'))
        ->viewData('page')['props']['summary'];

    $this->post(route('sales.void', $sale), ['reason' => 'Refund']);

    $after = $this->get(route('sales'))->viewData('page')['props']['summary'];

    expect($after['revenue'])->toBe(round($before['revenue'] - 30, 2))
        ->and($after['count'])->toBe($before['count'] - 1);
});

test('a cashier cannot void a sale', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    [$sale, $product] = makeSaleWithProduct();

    $this->actingAs($cashier)
        ->post(route('sales.void', $sale), ['reason' => 'Nope'])
        ->assertForbidden();

    expect($sale->fresh()->status)->toBe('completed')
        ->and($product->fresh()->stock_quantity)->toBe(8);
});

test('a sale cannot be voided twice', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$sale, $product] = makeSaleWithProduct(qty: 2, stockAfterSale: 8);

    $this->actingAs($admin)->post(route('sales.void', $sale), ['reason' => 'First void']);
    $this->post(route('sales.void', $sale), ['reason' => 'Second void'])
        ->assertSessionHasErrors('sale');

    // Stock restored exactly once
    expect($product->fresh()->stock_quantity)->toBe(10);
});

test('voiding requires a reason', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$sale] = makeSaleWithProduct();

    $this->actingAs($admin)
        ->post(route('sales.void', $sale), ['reason' => ''])
        ->assertSessionHasErrors('reason');

    expect($sale->fresh()->status)->toBe('completed');
});
