<?php

use App\Models\Sale;
use App\Models\User;

function makeSale(string $status, float $total = 100): Sale
{
    return Sale::create([
        'invoice_number' => Sale::generateInvoiceNumber(),
        'subtotal'       => $total,
        'discount'       => 0,
        'tax'            => 0,
        'total'          => $total,
        'amount_paid'    => $total,
        'change'         => 0,
        'payment_method' => 'cash',
        'status'         => $status,
    ]);
}

function salesProps($response): array
{
    return $response->viewData('page')['props'];
}

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

test('filtering by voided shows only voided sales and totals them', function () {
    makeSale('completed', 100);
    makeSale('completed', 50);
    makeSale('voided', 75);

    $props = salesProps($this->actingAs($this->admin)->get(route('sales', ['status' => 'voided'])));

    expect($props['sales']['data'])->toHaveCount(1)
        ->and($props['sales']['data'][0]['status'])->toBe('voided')
        ->and($props['summary']['count'])->toBe(1)
        ->and($props['summary']['revenue'])->toBe(75.0)
        ->and($props['filters']['status'])->toBe('voided');
});

test('filtering by completed excludes voided sales', function () {
    makeSale('completed', 100);
    makeSale('voided', 75);

    $props = salesProps($this->actingAs($this->admin)->get(route('sales', ['status' => 'completed'])));

    expect($props['sales']['data'])->toHaveCount(1)
        ->and($props['sales']['data'][0]['status'])->toBe('completed')
        ->and($props['summary']['revenue'])->toBe(100.0);
});

test('without a status filter all rows show but revenue stays completed-only', function () {
    makeSale('completed', 100);
    makeSale('voided', 75);

    $props = salesProps($this->actingAs($this->admin)->get(route('sales')));

    expect($props['sales']['data'])->toHaveCount(2)          // both rows listed
        ->and($props['summary']['revenue'])->toBe(100.0)      // voided excluded from revenue
        ->and($props['filters']['status'])->toBeNull();
});

test('an unknown status value is ignored', function () {
    makeSale('completed', 100);

    $props = salesProps($this->actingAs($this->admin)->get(route('sales', ['status' => 'hacked'])));

    expect($props['filters']['status'])->toBeNull()
        ->and($props['sales']['data'])->toHaveCount(1);
});
