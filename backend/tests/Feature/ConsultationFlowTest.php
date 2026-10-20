<?php

namespace Tests\Feature;

use App\Models\Person;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ConsultationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_doctor_saves_consultation_and_orders_together(): void
    {
        $doctor = User::create(['username' => 'doctor', 'name' => 'Doctor', 'role' => 'doctor', 'status' => 'active', 'password' => 'password']);
        $token = 'doctor-token';
        DB::table('api_tokens')->insert(['user_id' => $doctor->id, 'token_hash' => hash('sha256', $token), 'created_at' => now(), 'updated_at' => now()]);
        $person = Person::create(['person_type' => 'student', 'first_name' => 'Aisha', 'last_name' => 'Nakato']);
        $visit = Visit::create(['visit_number' => 'V-TEST-1', 'queue_number' => 'Q001', 'person_id' => $person->id]);
        $drugId = DB::table('drugs')->insertGetId(['name' => 'Paracetamol', 'stock_qty' => 50, 'created_at' => now(), 'updated_at' => now()]);
        $testId = DB::table('lab_tests')->insertGetId(['test_name' => 'Malaria test', 'created_at' => now(), 'updated_at' => now()]);

        $this->withToken($token)->postJson("/api/visits/{$visit->id}/consultation", [
            'symptoms' => 'Fever',
            'diagnosis' => 'Suspected malaria',
            'notes' => 'Review results today',
            'routes' => ['sent_to_lab', 'sent_to_pharmacy', 'sent_to_injection'],
            'prescriptions' => [['drug_id' => $drugId, 'dosage' => '1 tablet', 'frequency' => 'Twice daily', 'duration' => '3 days', 'quantity' => 6]],
            'lab_orders' => [['test_id' => $testId]],
        ])->assertOk()->assertJsonPath('data.status', 'awaiting_services');

        $this->assertDatabaseHas('visits', ['id' => $visit->id, 'doctor_id' => $doctor->id, 'diagnosis' => 'Suspected malaria', 'status' => 'awaiting_services']);
        $this->assertDatabaseCount('prescriptions', 1);
        $this->assertDatabaseCount('prescription_items', 1);
        $this->assertDatabaseCount('lab_requests', 1);
        $this->assertDatabaseCount('injection_orders', 1);
    }
}
