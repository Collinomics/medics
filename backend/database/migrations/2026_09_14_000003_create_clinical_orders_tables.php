<?php
use Illuminate\Database\Migrations\Migration; use Illuminate\Database\Schema\Blueprint; use Illuminate\Support\Facades\Schema;
return new class extends Migration { public function up():void {
 Schema::create('drugs',fn(Blueprint $t)=>[$t->id(),$t->string('name'),$t->string('category')->nullable(),$t->string('unit')->default('tablets'),$t->string('location')->default('Pharmacy'),$t->integer('stock_qty')->default(0),$t->timestamps()]);
 Schema::create('lab_tests',fn(Blueprint $t)=>[$t->id(),$t->string('test_name'),$t->text('description')->nullable(),$t->timestamps()]);
 Schema::create('lab_requests',fn(Blueprint $t)=>[$t->id(),$t->foreignId('visit_id')->constrained(),$t->foreignId('test_id')->constrained('lab_tests'),$t->foreignId('requested_by')->constrained('users'),$t->string('status')->default('pending'),$t->text('result')->nullable(),$t->text('remarks')->nullable(),$t->timestamps()]);
 Schema::create('prescriptions',fn(Blueprint $t)=>[$t->id(),$t->foreignId('visit_id')->constrained(),$t->foreignId('doctor_id')->constrained('users'),$t->string('status')->default('pending'),$t->timestamps()]);
 Schema::create('prescription_items',fn(Blueprint $t)=>[$t->id(),$t->foreignId('prescription_id')->constrained()->cascadeOnDelete(),$t->foreignId('drug_id')->constrained(),$t->string('dosage')->nullable(),$t->string('frequency')->nullable(),$t->string('duration')->nullable(),$t->integer('quantity'),$t->timestamps()]);
 Schema::create('injection_orders',fn(Blueprint $t)=>[$t->id(),$t->foreignId('visit_id')->constrained(),$t->foreignId('ordered_by')->constrained('users'),$t->string('status')->default('pending'),$t->timestamps()]);
 } public function down():void{Schema::dropIfExists('injection_orders');Schema::dropIfExists('prescription_items');Schema::dropIfExists('prescriptions');Schema::dropIfExists('lab_requests');Schema::dropIfExists('lab_tests');Schema::dropIfExists('drugs');} };
