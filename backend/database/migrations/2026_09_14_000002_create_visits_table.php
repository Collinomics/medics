<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('visits', function(Blueprint $t){$t->id();$t->string('visit_number')->unique();$t->string('queue_number');$t->foreignId('person_id')->constrained('persons');$t->foreignId('receptionist_id')->nullable()->constrained('users')->nullOnDelete();$t->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();$t->decimal('temperature',4,1)->nullable();$t->string('blood_pressure')->nullable();$t->decimal('weight',5,2)->nullable();$t->text('symptoms')->nullable();$t->string('status')->default('waiting');$t->text('diagnosis')->nullable();$t->text('notes')->nullable();$t->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('visits'); }
};
