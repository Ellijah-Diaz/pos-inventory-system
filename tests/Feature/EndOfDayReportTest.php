<?php

use App\Models\Sale;
use App\Models\User;

function makeCompletedSale(User $cashier, float $total, string $method = 'cash', float $discount = 0, string $status = 'completed'): Sale
{
    return Sale::create([
        'invoice_number' => Sale::generateInvoiceNumber(),
        'user_id'        => $cashier->id,
        'subtotal'       => $total + $discount,
        'discount'       => $discount,
        'tax'            => 0,
        'total'          => $total,
        'amount_paid'    => $total,
        'change'         => 0,
        'payment_method' => $method,
        'status'         => $status,
    ]);
}

function eodProps($response): array
{
    return $response->viewData('page')['props'];
}

test('the end-of-day report totals the day correctly', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeCompletedSale($admin, 100, 'cash');
    makeCompletedSale($admin, 50, 'cash', discount: 10);
    makeCompletedSale($admin, 200, 'gcash');
    makeCompletedSale($admin, 75, 'card');
    makeCompletedSale($admin, 999, 'cash', status: 'voided'); // must not count

    $report = eodProps($this->actingAs($admin)->get(route('reports.eod')))['report'];

    expect($report['transactions'])->toBe(4)
        ->and($report['net'])->toBe(425.0)          // 100+50+200+75
        ->and($report['discounts'])->toBe(10.0)
        ->and($report['methods']['cash']['count'])->toBe(2)
        ->and($report['methods']['cash']['amount'])->toBe(150.0)
        ->and($report['methods']['gcash']['amount'])->toBe(200.0)
        ->and($report['methods']['card']['amount'])->toBe(75.0)
        ->and($report['cash_drawer'])->toBe(150.0)  // only cash sales
        ->and($report['voided_count'])->toBe(1)
        ->and($report['voided_amount'])->toBe(999.0);
});

test('a cashier only sees their own numbers', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $other   = User::factory()->create(['role' => 'cashier']);

    makeCompletedSale($cashier, 100);
    makeCompletedSale($other, 500);

    $props = eodProps($this->actingAs($cashier)->get(route('reports.eod')));

    expect($props['report']['net'])->toBe(100.0)
        ->and($props['report']['transactions'])->toBe(1)
        ->and($props['cashiers'])->toBe([]); // no cashier picker for cashiers
});

test('an admin can filter by cashier', function () {
    $admin   = User::factory()->create(['role' => 'admin']);
    $cashier = User::factory()->create(['role' => 'cashier']);

    makeCompletedSale($admin, 300);
    makeCompletedSale($cashier, 120);

    $all = eodProps($this->actingAs($admin)->get(route('reports.eod')))['report'];
    $one = eodProps($this->get(route('reports.eod', ['user_id' => $cashier->id])))['report'];

    expect($all['net'])->toBe(420.0)
        ->and($one['net'])->toBe(120.0);
});

test('the report respects the date filter', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $old = makeCompletedSale($admin, 100);
    $old->timestamps = false;
    $old->forceFill(['created_at' => now()->subDays(3)])->save();

    makeCompletedSale($admin, 250);

    $today    = eodProps($this->actingAs($admin)->get(route('reports.eod')))['report'];
    $backThen = eodProps($this->get(route('reports.eod', [
        'date' => now()->subDays(3)->toDateString(),
    ])))['report'];

    expect($today['net'])->toBe(250.0)
        ->and($backThen['net'])->toBe(100.0);
});
