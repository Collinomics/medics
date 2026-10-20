<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('persons', function (Blueprint $table) {
            $table->id();
            $table->string('person_type', 30);
            $table->string('first_name');
            $table->string('last_name');
            $table->string('gender', 30)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('blood_group', 10)->nullable();
            $table->string('registration_number')->nullable()->unique();
            $table->string('student_number')->nullable()->unique();
            $table->string('staff_number')->nullable()->unique();
            $table->string('faculty')->nullable();
            $table->string('course')->nullable();
            $table->unsignedSmallInteger('year_of_entry')->nullable();
            $table->unsignedTinyInteger('year_of_study')->nullable();
            $table->unsignedTinyInteger('course_duration')->nullable();
            $table->string('position')->nullable();
            $table->text('chronic_conditions')->nullable();
            $table->text('hospitalisation_history')->nullable();
            $table->text('known_allergies')->nullable();
            $table->string('next_of_kin_name')->nullable();
            $table->string('next_of_kin_relationship')->nullable();
            $table->string('next_of_kin_phone', 30)->nullable();
            $table->string('verification_status', 30)->default('pending_verification');
            $table->text('verification_notes')->nullable();
            $table->foreignId('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->string('medical_card_number')->nullable()->unique();
            $table->date('medical_card_issued_at')->nullable();
            $table->date('medical_card_expires_at')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('person_id')->references('id')->on('persons')->cascadeOnDelete();
        });

        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_tokens');
        Schema::table('users', fn (Blueprint $table) => $table->dropForeign(['person_id']));
        Schema::dropIfExists('persons');
    }
};
