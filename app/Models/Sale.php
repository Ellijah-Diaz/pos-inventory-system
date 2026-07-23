<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    protected $fillable = [
        'invoice_number',
        'user_id',
        'subtotal',
        'discount',
        'tax',
        'total',
        'amount_paid',
        'change',
        'payment_method',
        'status',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'subtotal'    => 'decimal:2',
        'discount'    => 'decimal:2',
        'tax'         => 'decimal:2',
        'total'       => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'change'      => 'decimal:2',
        'voided_at'   => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    /**
     * Generate the next sequential invoice number, e.g. INV-20260722-0001.
     */
    public static function generateInvoiceNumber(): string
    {
        $prefix = 'INV-' . now()->format('Ymd') . '-';

        $lastNumber = static::where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('invoice_number')
            ->value('invoice_number');

        $sequence = $lastNumber ? ((int) substr($lastNumber, -4)) + 1 : 1;

        return $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
