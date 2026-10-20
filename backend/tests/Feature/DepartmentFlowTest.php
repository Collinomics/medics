<?php

namespace Tests\Feature;

use App\Models\Person;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DepartmentFlowTest extends TestCase
{
    use RefreshDatabase;

    private function token(string $role): string {
        $user = User::create(['username' => $role, 'name' => ucfirst($role), 'role' => $role, 'status' => 'active', 'password' => 'password']);
        $token = "$role-token";
        DB::table('api_tokens')->insert(['user_id'=>$user->id, 'token_hash'=>hash('sha256',$token), 'created_at'=>now(), 'updated_at'=>now()]);
        return $token;
    }

    public function test_lab_pharmacy_and_injection_process_clinical_orders(): void
    {
        $doctorToken = $this->token('doctor'); $labToken = $this->token('lab'); $pharmacyToken = $this->token('pharmacy'); $injectionToken = $this->token('injection');
        $person = Person::create(['person_type'=>'student','first_name'=>'Brian','last_name'=>'Kato']);
        $visit = Visit::create(['visit_number'=>'V-DEPT-1','queue_number'=>'Q1','person_id'=>$person->id]);
        $drug = DB::table('drugs')->insertGetId(['name'=>'Amoxicillin','stock_qty'=>10,'created_at'=>now(),'updated_at'=>now()]);
        $test = DB::table('lab_tests')->insertGetId(['test_name'=>'Blood test','created_at'=>now(),'updated_at'=>now()]);
        $this->withToken($doctorToken)->postJson("/api/visits/{$visit->id}/consultation", ['diagnosis'=>'Infection','routes'=>['sent_to_lab','sent_to_pharmacy','sent_to_injection'],'prescriptions'=>[['drug_id'=>$drug,'quantity'=>2]],'lab_orders'=>[['test_id'=>$test]]])->assertOk();
        $labId = DB::table('lab_requests')->value('id'); $rxId = DB::table('prescriptions')->value('id'); $injectionId = DB::table('injection_orders')->value('id');
        $this->withToken($labToken)->putJson("/api/lab-requests/$labId", ['result'=>'Negative'])->assertOk();
        $this->withToken($pharmacyToken)->putJson("/api/prescriptions/$rxId/dispense")->assertOk();
        $this->withToken($injectionToken)->putJson("/api/injection-orders/$injectionId/done", ['drug'=>'Tetanus toxoid','discharged_to'=>'discharged'])->assertOk();
        $this->assertDatabaseHas('lab_requests',['id'=>$labId,'status'=>'completed']);
        $this->assertDatabaseHas('prescriptions',['id'=>$rxId,'status'=>'dispensed']);
        $this->assertDatabaseHas('drugs',['id'=>$drug,'stock_qty'=>8]);
        $this->assertDatabaseHas('stock_movements',['drug_id'=>$drug,'quantity'=>-2]);
        $this->assertDatabaseHas('injection_orders',['id'=>$injectionId,'status'=>'done']);
    }
}
