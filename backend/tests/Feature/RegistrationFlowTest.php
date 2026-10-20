<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
class RegistrationFlowTest extends TestCase {
 use RefreshDatabase;
 public function test_patient_registration_approval_and_login():void {
  $registered=$this->postJson('/api/auth/register',['person_type'=>'student','surname'=>'Nakato','other_names'=>'Aisha',
   'contact'=>'0700000000','student_no'=>'2400000001','password'=>'secret12','confirm_password'=>'secret12']);
  $registered->assertCreated()->assertJsonPath('data.verification_status','pending_verification');
  $this->postJson('/api/auth/login',['username'=>'2400000001','password'=>'secret12'])->assertForbidden();

  $admin=User::create(['username'=>'admin','name'=>'Admin','role'=>'admin','status'=>'active','password'=>'password']);
  $token='admin-test-token';
  DB::table('api_tokens')->insert(['user_id'=>$admin->id,'token_hash'=>hash('sha256',$token),'created_at'=>now(),'updated_at'=>now()]);
  $personId=$registered->json('data.id');
  $this->withToken($token)->putJson("/api/admin/pending-registrations/$personId/approve")
   ->assertOk()->assertJsonPath('data.verification_status','approved');
  $this->postJson('/api/auth/login',['username'=>'2400000001','password'=>'secret12'])
   ->assertOk()->assertJsonPath('data.user.role','student');
 }
}
