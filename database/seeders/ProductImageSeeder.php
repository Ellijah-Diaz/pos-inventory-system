<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class ProductImageSeeder extends Seeder
{
    /**
     * Generate a clean placeholder image for every product:
     * a category-coloured card with the product name centred.
     * Repeatable — regenerates and replaces existing images.
     */
    public function run(): void
    {
        if (! extension_loaded('gd')) {
            $this->command?->error('PHP GD extension is required.');
            return;
        }

        $fontBold = 'C:\\Windows\\Fonts\\arialbd.ttf';
        $font     = 'C:\\Windows\\Fonts\\arial.ttf';
        $useTtf   = file_exists($fontBold) && file_exists($font);

        // Category → base colour (RGB)
        $palette = [
            'Beverages'     => [37, 99, 235],
            'Snacks'        => [217, 119, 6],
            'Groceries'     => [22, 163, 74],
            'Personal Care' => [124, 58, 237],
            'Household'     => [13, 148, 136],
        ];

        Storage::disk('public')->makeDirectory('products');

        foreach (Product::with('category')->get() as $product) {
            $w = 400;
            $h = 400;
            $im = imagecreatetruecolor($w, $h);

            $rgb = $palette[$product->category?->name] ?? $this->hashColour($product->name);
            imagefilledrectangle($im, 0, 0, $w, $h, imagecolorallocate($im, ...$rgb));

            // subtle darker footer band for the category label
            imagefilledrectangle($im, 0, $h - 64, $w, $h, imagecolorallocatealpha($im, 0, 0, 0, 95));

            $white = imagecolorallocate($im, 255, 255, 255);

            if ($useTtf) {
                $this->drawWrappedText($im, $fontBold, 27, $white, $product->name, $w, $h - 64);
                if ($product->category) {
                    imagettftext($im, 12, 0, 22, $h - 24, imagecolorallocatealpha($im, 255, 255, 255, 45),
                        $font, strtoupper($product->category->name));
                }
            } else {
                imagestring($im, 5, 20, (int) ($h / 2), $product->name, $white);
            }

            ob_start();
            imagepng($im);
            $data = ob_get_clean();
            imagedestroy($im);

            $path = 'products/product-' . $product->id . '.png';

            // remove any previously-stored (differently named) image
            if ($product->image && $product->image !== $path) {
                Storage::disk('public')->delete($product->image);
            }

            Storage::disk('public')->put($path, $data);
            $product->update(['image' => $path]);
        }

        $this->command?->info('Generated images for ' . Product::count() . ' products.');
    }

    /** Center wrapped text within the area above the footer band. */
    private function drawWrappedText($im, string $font, int $size, int $color, string $text, int $w, int $areaH): void
    {
        $maxWidth = $w - 60;
        $words = explode(' ', $text);
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            $trial = $current === '' ? $word : "{$current} {$word}";
            $bbox = imagettfbbox($size, 0, $font, $trial);
            if (($bbox[2] - $bbox[0]) > $maxWidth && $current !== '') {
                $lines[] = $current;
                $current = $word;
            } else {
                $current = $trial;
            }
        }
        if ($current !== '') {
            $lines[] = $current;
        }

        $lineHeight = $size + 12;
        $y = (int) ($areaH / 2 - (count($lines) * $lineHeight) / 2 + $size);

        foreach ($lines as $line) {
            $bbox = imagettfbbox($size, 0, $font, $line);
            $x = (int) (($w - ($bbox[2] - $bbox[0])) / 2);
            imagettftext($im, $size, 0, $x, $y, $color, $font, $line);
            $y += $lineHeight;
        }
    }

    /** Derive a stable colour from a string (fallback). */
    private function hashColour(string $text): array
    {
        $hash = crc32($text);
        return [100 + ($hash % 100), 60 + (($hash >> 8) % 120), 120 + (($hash >> 16) % 100)];
    }
}
