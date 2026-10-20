<?php
namespace Tests\Feature;
use App\Models\Person;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class ReceptionFlowTest extends TestCase {
 use RefreshDatabase;
 public function test_reception_registers_patient_and_adds_triage_visit():void {
  $u=User::create(['username'=>'reception','name'=>'Reception','role'=>'reception','status'=>'active','password'=>'password']);
  $token='reception-token';DB::table('api_tokens')->insert(['user_id'=>$u->id,'token_hash'=>hash('sha256',$token),'created_at'=>now(),'updated_at'=>now()]);
  $r=$this->withToken($token)->postJson('/api/patients',['patient_type'=>'student','firstname'=>'Brian','lastname'=>'Ssemakula','contact'=>'0700000001','student_no'=>'2400000002']);
  $r->assertCreated();$id=$r->json('data.id');
  $this->withToken($token)->postJson('/api/visits',['person_id'=>$id,'temperature'=>'37.2','blood_pressure'=>'120/80','symptoms'=>'Fever'])
   ->assertCreated()->assertJsonPath('data.status','waiting')->assertJsonPath('data.patient_name','Brian Ssemakula');
  $this->withToken($token)->getJson('/api/visits?date=today')->assertOk()->assertJsonCount(1,'data');
 }
}
