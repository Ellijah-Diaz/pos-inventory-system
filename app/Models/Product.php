<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'supplier_id',
        'sku',
        'barcode',
        'name',
        'description',
        'cost_price',
        'selling_price',
        'stock_quantity',
        'reorder_level',
        'unit',
        'image',
        'is_active',
    ];

    protected $casts = [
        'cost_price'     => 'decimal:2',
        'selling_price'  => 'decimal:2',
        'stock_quantity' => 'integer',
        'reorder_level'  => 'integer',
        'is_active'      => 'boolean',
    ];

    protected $appends = ['is_low_stock', 'image_url'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Whether stock has hit or fallen below the reorder level.
     */
    public function getIsLowStockAttribute(): bool
    {
        return $this->stock_quantity <= $this->reorder_level;
    }

    /**
     * Public URL of the product image (null if none).
     */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? Storage::url($this->image) : null;
    }

    /** Scope: only active products. */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /** Scope: products at or below their reorder level. */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereColumn('stock_quantity', '<=', 'reorder_level');
    }
}
