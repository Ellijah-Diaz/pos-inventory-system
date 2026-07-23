<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    /**
     * End-of-day (Z-reading) report: per-day, optionally per-cashier summary
     * of transactions, revenue by payment method, discounts, voids, and the
     * expected cash in the drawer.
     *
     * Cashiers always see their own numbers; admins can pick any cashier
     * (or all) and any date.
     */
    public function endOfDay(Request $request)
    {
        $user    = $request->user();
        $isAdmin = $user->role === 'admin';

        $date = $request->date('date') ?? today();

        // Cashiers are locked to themselves; admins may filter (0 = everyone)
        $cashierId = $isAdmin ? $request->integer('user_id') : $user->id;

        $base = fn () => Sale::query()
            ->whereDate('created_at', $date)
            ->when($cashierId, fn ($q) => $q->where('user_id', $cashierId));

        $completed = fn () => $base()->where('status', 'completed');

        // Per-payment-method breakdown (completed sales only)
        $methods = [];
        foreach (['cash', 'card', 'gcash', 'other'] as $method) {
            $q = $completed()->where('payment_method', $method);
            $methods[$method] = [
                'count'  => (clone $q)->count(),
                'amount' => round((float) (clone $q)->sum('total'), 2),
            ];
        }

        $firstInvoice = $completed()->orderBy('id')->value('invoice_number');
        $lastInvoice  = $completed()->orderByDesc('id')->value('invoice_number');

        return Inertia::render('Reports/EndOfDay', [
            'date'     => $date->toDateString(),
            'cashiers' => $isAdmin
                ? User::orderBy('name')->get(['id', 'name'])
                : [],
            'selectedCashier' => $cashierId ?: null,
            'report' => [
                'transactions'  => $completed()->count(),
                'gross'         => round((float) $completed()->sum('subtotal'), 2),
                'discounts'     => round((float) $completed()->sum('discount'), 2),
                'net'           => round((float) $completed()->sum('total'), 2),
                'items_sold'    => (int) $completed()->withCount('items')->get()->sum('items_count'),
                'methods'       => $methods,
                'cash_drawer'   => $methods['cash']['amount'], // expected cash on hand
                'voided_count'  => $base()->where('status', 'voided')->count(),
                'voided_amount' => round((float) $base()->where('status', 'voided')->sum('total'), 2),
                'first_invoice' => $firstInvoice,
                'last_invoice'  => $lastInvoice,
            ],
        ]);
    }
}
