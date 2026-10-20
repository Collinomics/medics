<?php
namespace App\Http\Controllers;
use App\Models\Person;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Support\SystemSettings;
class RegistrationApprovalController extends Controller {
 private function admin(Request $r){abort_unless($r->user()->role==='admin',403);}
 public function index(Request $r){$this->admin($r);return response()->json(['data'=>Person::where('verification_status','pending_verification')->latest()->get()]);}
 public function approve(Request $r,Person $person){
  $this->admin($r);
  DB::transaction(function()use($r,$person){$settings=SystemSettings::operational();$person->update(['verification_status'=>'approved','verified_by'=>$r->user()->id,
   'verified_at'=>now(),'medical_card_number'=>$person->medical_card_number??sprintf('%s-%s-%05d',$settings['card_number_prefix'],now()->year,$person->id),
   'medical_card_issued_at'=>today(),'medical_card_expires_at'=>$person->year_of_entry&&$person->course_duration?($person->year_of_entry+$person->course_duration).'-12-31':today()->addYears($settings['default_card_validity_years'])->endOfYear()]);
   DB::table('users')->where('person_id',$person->id)->update(['status'=>'active','updated_at'=>now()]);
   $uid=DB::table('users')->where('person_id',$person->id)->value('id');if($uid)DB::table('notifications')->insert(['user_id'=>$uid,'message'=>'Your registration was approved and medical card '.$person->medical_card_number.' was issued.','created_at'=>now(),'updated_at'=>now()]);
  });
  return response()->json(['data'=>$person->fresh()]);
 }
 public function reject(Request $r,Person $person){$this->admin($r);$data=$r->validate(['reason'=>'required|string|max:1000']);
  $person->update(['verification_status'=>'rejected','verification_notes'=>$data['reason'],'verified_by'=>$r->user()->id,'verified_at'=>now()]);
  DB::table('users')->where('person_id',$person->id)->update(['status'=>'inactive','updated_at'=>now()]);
  $uid=DB::table('users')->where('person_id',$person->id)->value('id');if($uid)DB::table('notifications')->insert(['user_id'=>$uid,'message'=>'Your registration needs correction: '.$data['reason'],'created_at'=>now(),'updated_at'=>now()]);
  return response()->json(['data'=>$person->fresh()]);}
}
