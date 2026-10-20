<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('injection_orders', function (Blueprint $table) {
            $table->string('drug')->nullable();
            $table->text('remarks')->nullable();
            $table->string('discharged_to')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
        });
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('drug_id')->constrained();
            $table->foreignId('prescription_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('quantity');
            $table->string('type');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('message');
            $table->boolean('read')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('stock_movements');
        Schema::table('injection_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('completed_by');
            $table->dropColumn(['drug', 'remarks', 'discharged_to', 'completed_at']);
        });
    }
};
