<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Void metadata: when, by whom, and why a sale was voided.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->timestamp('voided_at')->nullable()->after('status');
            $table->foreignId('voided_by')->nullable()->after('voided_at')
                ->constrained('users')->nullOnDelete();
            $table->string('void_reason')->nullable()->after('voided_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('voided_by');
            $table->dropColumn(['voided_at', 'void_reason']);
        });
    }
};
