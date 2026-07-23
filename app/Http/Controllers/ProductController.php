<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search   = $request->string('search')->toString();
        $category = $request->integer('category_id');
        $lowStock = $request->boolean('low_stock');

        $products = Product::query()
            ->with(['category:id,name', 'supplier:id,name'])
            ->when($search, fn ($q) => $q
                ->where(fn ($sub) => $sub
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")))
            ->when($category, fn ($q) => $q->where('category_id', $category))
            ->when($lowStock, fn ($q) => $q->lowStock())
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products'   => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'suppliers'  => Supplier::orderBy('name')->get(['id', 'name']),
            'filters'    => [
                'search'      => $search,
                'category_id' => $category ?: null,
                'low_stock'   => $lowStock,
            ],
            'stats' => [
                'total'     => Product::count(),
                'active'    => Product::where('is_active', true)->count(),
                'low_stock' => Product::lowStock()->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateProduct($request);
        unset($data['remove_image']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        } else {
            unset($data['image']);
        }

        Product::create($data);

        return back()->with('success', 'Product created.');
    }

    public function update(Request $request, Product $product)
    {
        $data = $this->validateProduct($request, $product);
        $removeImage = (bool) ($data['remove_image'] ?? false);
        unset($data['remove_image']);

        if ($request->hasFile('image')) {
            $this->deleteImage($product);
            $data['image'] = $request->file('image')->store('products', 'public');
        } elseif ($removeImage) {
            $this->deleteImage($product);
            $data['image'] = null;
        } else {
            unset($data['image']); // keep the current image
        }

        $product->update($data);

        return back()->with('success', 'Product updated.');
    }

    public function destroy(Product $product)
    {
        $this->deleteImage($product);
        $product->delete();

        return back()->with('success', 'Product deleted.');
    }

    private function deleteImage(Product $product): void
    {
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
    }

    private function validateProduct(Request $request, ?Product $product = null): array
    {
        $id = $product?->id;

        return $request->validate([
            'category_id'    => ['nullable', 'exists:categories,id'],
            'supplier_id'    => ['nullable', 'exists:suppliers,id'],
            'sku'            => ['required', 'string', 'max:255', Rule::unique('products', 'sku')->ignore($id)],
            'barcode'        => ['nullable', 'string', 'max:255', Rule::unique('products', 'barcode')->ignore($id)],
            'name'           => ['required', 'string', 'max:255'],
            'description'    => ['nullable', 'string'],
            'cost_price'     => ['required', 'numeric', 'min:0'],
            'selling_price'  => ['required', 'numeric', 'min:0'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'reorder_level'  => ['required', 'integer', 'min:0'],
            'unit'           => ['required', 'string', 'max:50'],
            'is_active'      => ['boolean'],
            'image'          => ['nullable', 'image', 'max:2048'], // 2MB
            'remove_image'   => ['nullable', 'boolean'],
        ]);
    }
}
