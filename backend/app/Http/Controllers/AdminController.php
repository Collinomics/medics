<?php
namespace App\Http\Controllers;
use App\Models\Person;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Support\Audit;
class AdminController extends Controller {
 private function guard(Request $r){abort_unless($r->user()->role==='admin',403);}
 public function stats(Request $r){$this->guard($r);return response()->json(['data'=>[
  'total_patients'=>Person::count(),'visits_today'=>DB::table('visits')->whereDate('created_at',today())->count(),
  'active_staff'=>User::where('status','active')->whereIn('role',['admin','reception','doctor','lab','pharmacy','injection','dental','records'])->count(),
  'cards_issued'=>Person::whereNotNull('medical_card_number')->count(),'pending_lab'=>DB::table('lab_requests')->where('status','pending')->count(),'pending_rx'=>DB::table('prescriptions')->where('status','pending')->count()]]);}
 public function staff(Request $r){$this->guard($r);return response()->json(['data'=>User::whereIn('role',['admin','reception','doctor','lab','pharmacy','injection','dental','records'])->get()]);}
 public function createStaff(Request $r){$this->guard($r);$d=$r->validate(['name'=>'required|string','username'=>'required|string|unique:users','email'=>'nullable|email|unique:users','role'=>'required|in:admin,reception,doctor,lab,pharmacy,injection,dental,records','department'=>'nullable|string','password'=>'nullable|string|min:6']);$u=User::create([...$d,'password'=>$d['password']??'password','status'=>'active']);Audit::record($r,'created','user',$u->id,['role'=>$u->role]);return response()->json(['data'=>$u],201);}
 public function updateStaff(Request $r,User $user){$this->guard($r);$d=$r->validate(['name'=>'sometimes|string','username'=>'sometimes|string|unique:users,username,'.$user->id,'email'=>'nullable|email|unique:users,email,'.$user->id,'role'=>'sometimes|in:admin,reception,doctor,lab,pharmacy,injection,dental,records','department'=>'nullable|string','password'=>'nullable|string|min:6']);if(empty($d['password']))unset($d['password']);$user->update($d);Audit::record($r,'updated','user',$user->id);return response()->json(['data'=>$user->fresh()]);}
 public function toggleStaff(Request $r,User $user){$this->guard($r);abort_if($user->id===$r->user()->id,422,'You cannot deactivate your own account.');$user->update(['status'=>$user->status==='active'?'inactive':'active']);Audit::record($r,'status_changed','user',$user->id,['status'=>$user->status]);return response()->json(['data'=>$user]);}
}
