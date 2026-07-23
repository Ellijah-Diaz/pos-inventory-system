<?php

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function admin(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function productPayload(array $overrides = []): array
{
    return array_merge([
        'sku'            => 'SKU-IMG-' . fake()->unique()->numerify('####'),
        'name'           => 'Imaged Product',
        'cost_price'     => 10,
        'selling_price'  => 20,
        'stock_quantity' => 5,
        'reorder_level'  => 2,
        'unit'           => 'pcs',
        'is_active'      => true,
    ], $overrides);
}

it('stores an uploaded image when creating a product', function () {
    Storage::fake('public');

    $this->actingAs(admin())->post('/products', productPayload([
        'image' => UploadedFile::fake()->image('photo.jpg'),
    ]))->assertRedirect();

    $product = Product::first();
    expect($product->image)->not->toBeNull();
    Storage::disk('public')->assertExists($product->image);
});

it('replaces the old image and deletes it on update', function () {
    Storage::fake('public');
    $admin = admin();

    $this->actingAs($admin)->post('/products', productPayload([
        'image' => UploadedFile::fake()->image('old.jpg'),
    ]));
    $product = Product::first();
    $oldPath = $product->image;

    $this->actingAs($admin)->post("/products/{$product->id}", array_merge(productPayload([
        'sku' => $product->sku,
    ]), [
        '_method' => 'PUT',
        'image'   => UploadedFile::fake()->image('new.jpg'),
    ]))->assertRedirect();

    $product->refresh();
    expect($product->image)->not->toBe($oldPath);
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($product->image);
});

it('removes the image when remove_image is set', function () {
    Storage::fake('public');
    $admin = admin();

    $this->actingAs($admin)->post('/products', productPayload([
        'image' => UploadedFile::fake()->image('x.jpg'),
    ]));
    $product = Product::first();
    $path = $product->image;

    $this->actingAs($admin)->post("/products/{$product->id}", array_merge(productPayload([
        'sku' => $product->sku,
    ]), ['_method' => 'PUT', 'remove_image' => true]))->assertRedirect();

    expect($product->fresh()->image)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

it('deletes the image file when the product is deleted', function () {
    Storage::fake('public');
    $admin = admin();

    $this->actingAs($admin)->post('/products', productPayload([
        'image' => UploadedFile::fake()->image('y.jpg'),
    ]));
    $product = Product::first();
    $path = $product->image;

    $this->actingAs($admin)->delete("/products/{$product->id}")->assertRedirect();

    Storage::disk('public')->assertMissing($path);
});

it('rejects a non-image file', function () {
    Storage::fake('public');

    $this->actingAs(admin())->post('/products', productPayload([
        'image' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
    ]))->assertSessionHasErrors('image');
});
