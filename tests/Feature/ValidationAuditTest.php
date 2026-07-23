<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

// ── Categories ────────────────────────────────────────────────
test('category requires a name', function () {
    $this->actingAs($this->admin)
        ->post(route('categories.store'), ['name' => ''])
        ->assertSessionHasErrors('name');
});

test('category name must be unique', function () {
    Category::create(['name' => 'Beverages']);
    $this->actingAs($this->admin)
        ->post(route('categories.store'), ['name' => 'Beverages'])
        ->assertSessionHasErrors('name');
});

// ── Suppliers ─────────────────────────────────────────────────
test('supplier requires a name and valid email', function () {
    $this->actingAs($this->admin)
        ->post(route('suppliers.store'), ['name' => '', 'email' => 'not-an-email'])
        ->assertSessionHasErrors(['name', 'email']);
});

// ── Products ──────────────────────────────────────────────────
test('product requires sku, name, prices and stock', function () {
    $this->actingAs($this->admin)
        ->post(route('products.store'), [])
        ->assertSessionHasErrors(['sku', 'name', 'cost_price', 'selling_price', 'stock_quantity', 'reorder_level', 'unit']);
});

test('product rejects negative prices and stock', function () {
    $this->actingAs($this->admin)
        ->post(route('products.store'), [
            'sku' => 'X-1', 'name' => 'X', 'unit' => 'pc',
            'cost_price' => -5, 'selling_price' => -1,
            'stock_quantity' => -3, 'reorder_level' => -2,
        ])
        ->assertSessionHasErrors(['cost_price', 'selling_price', 'stock_quantity', 'reorder_level']);
});

test('product sku must be unique', function () {
    Product::create([
        'sku' => 'DUP-1', 'name' => 'A', 'unit' => 'pc',
        'cost_price' => 1, 'selling_price' => 2,
        'stock_quantity' => 1, 'reorder_level' => 1,
    ]);
    $this->actingAs($this->admin)
        ->post(route('products.store'), [
            'sku' => 'DUP-1', 'name' => 'B', 'unit' => 'pc',
            'cost_price' => 1, 'selling_price' => 2,
            'stock_quantity' => 1, 'reorder_level' => 1,
        ])
        ->assertSessionHasErrors('sku');
});

test('product category and supplier must exist', function () {
    $this->actingAs($this->admin)
        ->post(route('products.store'), [
            'sku' => 'FK-1', 'name' => 'X', 'unit' => 'pc',
            'cost_price' => 1, 'selling_price' => 2,
            'stock_quantity' => 1, 'reorder_level' => 1,
            'category_id' => 999, 'supplier_id' => 999,
        ])
        ->assertSessionHasErrors(['category_id', 'supplier_id']);
});

// ── Stock ─────────────────────────────────────────────────────
test('stock movement rejects zero quantity for in and out', function () {
    $product = Product::create([
        'sku' => 'S-1', 'name' => 'S', 'unit' => 'pc',
        'cost_price' => 1, 'selling_price' => 2,
        'stock_quantity' => 10, 'reorder_level' => 1,
    ]);
    $this->actingAs($this->admin)
        ->post(route('stock.store'), ['product_id' => $product->id, 'type' => 'out', 'quantity' => 0])
        ->assertSessionHasErrors('quantity');
});

test('stock movement cannot remove more than on hand', function () {
    $product = Product::create([
        'sku' => 'S-2', 'name' => 'S2', 'unit' => 'pc',
        'cost_price' => 1, 'selling_price' => 2,
        'stock_quantity' => 5, 'reorder_level' => 1,
    ]);
    $this->actingAs($this->admin)
        ->post(route('stock.store'), ['product_id' => $product->id, 'type' => 'out', 'quantity' => 99])
        ->assertSessionHasErrors('quantity');
    expect($product->fresh()->stock_quantity)->toBe(5);
});

test('stock movement rejects an invalid type', function () {
    $product = Product::create([
        'sku' => 'S-3', 'name' => 'S3', 'unit' => 'pc',
        'cost_price' => 1, 'selling_price' => 2,
        'stock_quantity' => 5, 'reorder_level' => 1,
    ]);
    $this->actingAs($this->admin)
        ->post(route('stock.store'), ['product_id' => $product->id, 'type' => 'steal', 'quantity' => 1])
        ->assertSessionHasErrors('type');
});

// ── POS ───────────────────────────────────────────────────────
test('pos checkout requires at least one item', function () {
    $this->actingAs($this->admin)
        ->post(route('pos.store'), ['items' => [], 'payment_method' => 'cash', 'amount_paid' => 0])
        ->assertSessionHasErrors('items');
});

test('pos checkout rejects an excessive discount', function () {
    $product = Product::create([
        'sku' => 'P-1', 'name' => 'P', 'unit' => 'pc',
        'cost_price' => 1, 'selling_price' => 10,
        'stock_quantity' => 5, 'reorder_level' => 1,
    ]);
    $this->actingAs($this->admin)
        ->post(route('pos.store'), [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'discount' => 999, 'payment_method' => 'cash', 'amount_paid' => 1000,
        ])
        ->assertSessionHasErrors('discount');
});

test('pos checkout rejects an invalid payment method', function () {
    $product = Product::create([
        'sku' => 'P-2', 'name' => 'P2', 'unit' => 'pc',
        'cost_price' => 1, 'selling_price' => 10,
        'stock_quantity' => 5, 'reorder_level' => 1,
    ]);
    $this->actingAs($this->admin)
        ->post(route('pos.store'), [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'payment_method' => 'barter', 'amount_paid' => 10,
        ])
        ->assertSessionHasErrors('payment_method');
});

// ── Users ─────────────────────────────────────────────────────
test('user creation validates email, role, and password confirmation', function () {
    $this->actingAs($this->admin)
        ->post(route('users.store'), [
            'name' => 'X', 'email' => 'bad-email', 'role' => 'superadmin',
            'password' => 'password', 'password_confirmation' => 'different',
        ])
        ->assertSessionHasErrors(['email', 'role', 'password']);
});

test('user email must be unique', function () {
    $existing = User::factory()->create();
    $this->actingAs($this->admin)
        ->post(route('users.store'), [
            'name' => 'X', 'email' => $existing->email, 'role' => 'cashier',
            'password' => 'password', 'password_confirmation' => 'password',
        ])
        ->assertSessionHasErrors('email');
});

// ── Roles / access ────────────────────────────────────────────
test('cashiers cannot reach admin-only modules', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    foreach (['products.index', 'categories.index', 'suppliers.index', 'stock.index', 'users.index'] as $route) {
        $this->actingAs($cashier)->get(route($route))->assertForbidden();
    }
});
