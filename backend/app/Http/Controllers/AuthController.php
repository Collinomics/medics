<?php
namespace App\Http\Controllers;
use App\Models\Person;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Support\SystemSettings;
class AuthController extends Controller {
 public function register(Request $request) {
  $data=$request->validate([
   'person_type'=>'required|in:student,staff,dependent,other','surname'=>'required|string|max:80',
   'other_names'=>'required|string|max:80','contact'=>'required|string|max:30','email'=>'nullable|email|unique:users,email',
   'password'=>'required|string|min:6|same:confirm_password','confirm_password'=>'required|string',
   'student_no'=>'nullable|string|max:60','staff_no'=>'nullable|string|max:60',
   'sex'=>'nullable|string|max:30','dob'=>'nullable|date','reg_no'=>'nullable|string|max:60','faculty_id'=>'nullable|integer','course'=>'nullable|string|max:160','year_of_entry'=>'nullable|integer|min:1990|max:2100','year_of_study'=>'nullable|integer|min:1|max:10','course_duration'=>'nullable|integer|min:1|max:10','position'=>'nullable|string|max:100','home_address'=>'nullable|string|max:500']);
  [$person,$user]=DB::transaction(function()use($data,$request){
   $person=Person::create(['person_type'=>$data['person_type'],'first_name'=>$data['other_names'],'last_name'=>$data['surname'],
    'gender'=>$data['sex']??null,'date_of_birth'=>$data['dob']??null,'phone'=>$data['contact'],'email'=>$data['email']??null,
    'student_number'=>$data['student_no']??null,'staff_number'=>$data['staff_no']??null,'registration_number'=>$data['reg_no']??null,'faculty'=>$request->faculty_id ? (['1'=>'Faculty of Engineering','2'=>'Faculty of Computing and Informatics','3'=>'Faculty of Education','4'=>'Faculty of Health Sciences','5'=>'Faculty of Law','6'=>'Faculty of Science','7'=>'Faculty of Business and Management','8'=>'Faculty of Arts and Social Sciences','9'=>'School of Postgraduate Studies'][(string)$request->faculty_id]??null) : null,'course'=>$data['course']??null,'year_of_entry'=>$data['year_of_entry']??null,'year_of_study'=>$data['year_of_study']??null,'course_duration'=>$data['course_duration']??null,'position'=>$data['position']??null,'address'=>$data['home_address']??null,'known_allergies'=>$request->known_allergies,
    'next_of_kin_name'=>$request->kin_name,'next_of_kin_relationship'=>$request->kin_relation,'next_of_kin_phone'=>$request->kin_contact,
    'verification_status'=>'pending_verification']);
   $username=$data['student_no']??$data['staff_no']??Str::slug($data['surname']).substr($data['contact'],-4);
   $user=User::create(['person_id'=>$person->id,'username'=>$username,'name'=>$person->full_name,'email'=>$data['email']??null,
    'role'=>$data['person_type'],'status'=>'pending','password'=>$data['password']]);
   return [$person,$user];
  });
  if(SystemSettings::operational()['registration_auto_approve']){
   $settings=SystemSettings::operational();
   $person->update(['verification_status'=>'approved','verified_at'=>now(),'medical_card_number'=>sprintf('%s-%s-%05d',$settings['card_number_prefix'],now()->year,$person->id),'medical_card_issued_at'=>today(),'medical_card_expires_at'=>$person->year_of_entry&&$person->course_duration?($person->year_of_entry+$person->course_duration).'-12-31':today()->addYears($settings['default_card_validity_years'])->endOfYear()]);
   $user->update(['status'=>'active']);
  }
  return response()->json(['data'=>['id'=>$person->id,'full_name'=>$person->full_name,'username'=>$user->username,
   'email'=>$user->email,'verification_status'=>$person->verification_status]],201);
 }
 public function login(Request $request) {
  $data=$request->validate(['username'=>'required|string','password'=>'required|string']);
  $user=User::where('username',$data['username'])->first();
  if(!$user||!Hash::check($data['password'],$user->password)) return response()->json(['error'=>'Invalid username or password.'],422);
  if($user->status!=='active') return response()->json(['error'=>'Account is awaiting approval or inactive.'],403);
  $plain=Str::random(80);
  $sessionHours=SystemSettings::operational()['session_duration_hours'];
  DB::table('api_tokens')->insert(['user_id'=>$user->id,'token_hash'=>hash('sha256',$plain),'expires_at'=>now()->addHours($sessionHours),'created_at'=>now(),'updated_at'=>now()]);
  $account=$user->only('id','username','name','email','role');
  $account['photo_url']=$user->photo_path?url(Storage::disk('public')->url($user->photo_path)):null;
  $preferences=is_array($user->preferences)?$user->preferences:(json_decode($user->preferences?:'{}',true)?:[]);
  $account['notifications_enabled']=$preferences['notifications_enabled']??true;
  return response()->json(['data'=>['user'=>$account,'token'=>$plain]]);
 }
 public function me(Request $request){return response()->json(['data'=>$request->user()]);}
 public function logout(Request $request){DB::table('api_tokens')->where('user_id',$request->user()->id)->delete();return response()->json(['data'=>['message'=>'Logged out.']]);}
}
