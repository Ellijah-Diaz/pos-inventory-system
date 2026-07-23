<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Send the root straight to the app: dashboard if logged in, otherwise login.
Route::get('/', function () {
    return redirect()->route(auth()->check() ? 'dashboard' : 'login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

// POS + Sales — available to cashiers and admins.
Route::middleware('auth')->group(function () {
    Route::get('/pos', [PosController::class, 'index'])->name('pos');
    Route::post('/pos', [PosController::class, 'store'])->name('pos.store');

    Route::get('/sales', [SalesController::class, 'index'])->name('sales');
    Route::get('/sales/{sale}', [SalesController::class, 'show'])->name('sales.show');

    // End-of-day (Z-reading) — cashiers see their own; admins see everyone
    Route::get('/reports/end-of-day', [ReportController::class, 'endOfDay'])->name('reports.eod');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
 | Inventory management — admin only.
 */
Route::middleware(['auth', 'admin'])->group(function () {
    Route::post('/sales/{sale}/void', [SalesController::class, 'void'])->name('sales.void');

    Route::resource('products', ProductController::class)->except(['create', 'show', 'edit']);
    Route::resource('categories', CategoryController::class)->except(['create', 'show', 'edit']);
    Route::resource('suppliers', SupplierController::class)->except(['create', 'show', 'edit']);

    Route::get('/stock', [StockController::class, 'index'])->name('stock.index');
    Route::post('/stock', [StockController::class, 'store'])->name('stock.store');

    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
});

require __DIR__.'/auth.php';
