<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  Schema::table('users',fn(Blueprint $t)=>$t->string('department')->nullable());
  Schema::table('injection_orders',function(Blueprint $t){$t->string('dose')->nullable();$t->string('administration_route')->nullable();$t->text('instructions')->nullable();});
  Schema::table('prescription_items',function(Blueprint $t){$t->unsignedInteger('dispensed_quantity')->default(0);$t->string('dispensing_status')->default('pending');$t->text('dispensing_notes')->nullable();});
  Schema::create('referrals',function(Blueprint $t){$t->id();$t->foreignId('visit_id')->constrained();$t->string('department');$t->foreignId('referred_by')->constrained('users');$t->string('status')->default('pending');$t->text('notes')->nullable();$t->text('outcome')->nullable();$t->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();$t->timestamp('completed_at')->nullable();$t->timestamps();});
  Schema::create('audit_logs',function(Blueprint $t){$t->id();$t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();$t->string('action');$t->string('entity_type');$t->unsignedBigInteger('entity_id')->nullable();$t->json('details')->nullable();$t->string('ip_address',45)->nullable();$t->timestamps();});
 }
 public function down():void {Schema::dropIfExists('audit_logs');Schema::dropIfExists('referrals');Schema::table('prescription_items',fn(Blueprint $t)=>$t->dropColumn(['dispensed_quantity','dispensing_status','dispensing_notes']));Schema::table('injection_orders',fn(Blueprint $t)=>$t->dropColumn(['dose','administration_route','instructions']));Schema::table('users',fn(Blueprint $t)=>$t->dropColumn('department'));}
};
