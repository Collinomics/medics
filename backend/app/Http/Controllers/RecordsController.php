<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Support\SimplePdf;

class RecordsController extends Controller
{
    private function admin(Request $request): void { abort_unless(in_array($request->user()->role, ['admin', 'records'], true), 403); }
    public function drugs(Request $request) { $this->admin($request); return response()->json(['data'=>DB::table('drugs')->orderBy('name')->get()]); }
    public function trends(Request $request) {
        $this->admin($request);
        $from = $request->input('from', now()->subMonths(5)->startOfMonth()->toDateString()); $to = $request->input('to', now()->toDateString());
        $visitRows=DB::table('visits')->whereBetween('created_at',[$from,$to.' 23:59:59'])->get(['created_at','diagnosis']);
        $disease=$visitRows->groupBy(fn($v)=>\Carbon\Carbon::parse($v->created_at)->format('Y-m'))->map(function($rows,$key){$counts=['malaria'=>0,'fever'=>0,'typhoid'=>0];foreach($rows as $row){$d=strtolower($row->diagnosis??'');foreach(array_keys($counts) as $name)if(str_contains($d,$name)||($name==='fever'&&(str_contains($d,'flu')||str_contains($d,'urti'))))$counts[$name]++;}return ['month'=>\Carbon\Carbon::createFromFormat('Y-m',$key)->format('M'),...$counts];})->values();
        $usage=DB::table('stock_movements as s')->join('drugs as d','d.id','=','s.drug_id')->where('s.type','dispense')->whereBetween('s.created_at',[$from,$to.' 23:59:59'])->get(['s.created_at','s.quantity','d.name'])->groupBy(fn($x)=>\Carbon\Carbon::parse($x->created_at)->format('Y-m'))->map(function($rows,$key){$out=['month'=>\Carbon\Carbon::createFromFormat('Y-m',$key)->format('M'),'paracetamol'=>0,'coartem'=>0,'amoxicillin'=>0];foreach($rows as $row)foreach(['paracetamol','coartem','amoxicillin'] as $drug)if(str_contains(strtolower($row->name),$drug))$out[$drug]+=abs($row->quantity);return $out;})->values();
        $percent=function($rows,$field){$total=$rows->sum('count')?:1;return $rows->map(fn($x)=>['name'=>ucfirst($x->$field).($field==='person_type'?'s':''),'value'=>round($x->count/$total*100)]);};
        $types=DB::table('persons')->selectRaw('person_type,count(*) as count')->groupBy('person_type')->get();$genders=DB::table('persons')->whereNotNull('gender')->selectRaw('gender,count(*) as count')->groupBy('gender')->get();
        return response()->json(['data'=>['disease_trends'=>$disease,'drug_consumption'=>$usage,'demographics'=>['by_type'=>$percent($types,'person_type'),'by_gender'=>$percent($genders,'gender')]]]);
    }
    public function export(Request $request) {
        $this->admin($request); $from=$request->input('from'); $to=$request->input('to');
        $pdf=SimplePdf::make(['Kyambogo University Medical Center','Clinical Activity Report',"Period: {$from} to {$to}",'','Visits: '.DB::table('visits')->whereBetween('created_at',[$from,$to.' 23:59:59'])->count(),'Prescriptions dispensed: '.DB::table('prescriptions')->where('status','dispensed')->count(),'Lab results completed: '.DB::table('lab_requests')->where('status','completed')->count(),'Generated: '.now()->format('d M Y H:i')]);
        return response($pdf,200,['Content-Type'=>'application/pdf','Content-Disposition'=>'attachment; filename="mcis-report.pdf"']);
    }
    public function myProfile(Request $request) { abort_unless($request->user()->person_id, 404); return response()->json(['data'=>$this->profile($request->user()->person_id)]); }
    public function updateMyProfile(Request $request) {
        abort_unless($request->user()->person_id, 404); $data=$request->validate(['contact'=>'nullable|string','email'=>'nullable|email','home_address'=>'nullable|string','next_of_kin'=>'nullable|string','faculty'=>'nullable|string','course'=>'nullable|string','year_of_entry'=>'nullable|integer|min:1990|max:2100','year_of_study'=>'nullable|integer|min:1|max:10','course_duration'=>'nullable|integer|min:1|max:10']);
        $expiry=!empty($data['year_of_entry'])&&!empty($data['course_duration'])?($data['year_of_entry']+$data['course_duration']).'-12-31':null;
        DB::table('persons')->where('id',$request->user()->person_id)->update(['phone'=>$data['contact']??null,'email'=>$data['email']??null,'address'=>$data['home_address']??null,'next_of_kin_name'=>$data['next_of_kin']??null,'faculty'=>$data['faculty']??null,'course'=>$data['course']??null,'year_of_entry'=>$data['year_of_entry']??null,'year_of_study'=>$data['year_of_study']??null,'course_duration'=>$data['course_duration']??null,'medical_card_expires_at'=>$expiry?:DB::raw('medical_card_expires_at'),'updated_at'=>now()]);
        return response()->json(['data'=>$this->profile($request->user()->person_id)]);
    }
    public function myVisits(Request $request) {
        abort_unless($request->user()->person_id, 404);
        $rows=DB::table('visits as v')->leftJoin('users as d','d.id','=','v.doctor_id')->where('v.person_id',$request->user()->person_id)->select('v.*','d.name as doctor')->orderByDesc('v.created_at')->get();
        return response()->json(['data'=>$rows->map(function($x){$rx=DB::table('prescriptions as r')->join('prescription_items as i','i.prescription_id','=','r.id')->join('drugs as d','d.id','=','i.drug_id')->where('r.visit_id',$x->id)->pluck('d.name')->join(', ');$refs=collect();if(DB::table('lab_requests')->where('visit_id',$x->id)->exists())$refs->push('lab');if(DB::table('prescriptions')->where('visit_id',$x->id)->exists())$refs->push('pharmacy');if(DB::table('injection_orders')->where('visit_id',$x->id)->exists())$refs->push('injection');if(DB::table('referrals')->where('visit_id',$x->id)->where('department','dental')->exists())$refs->push('dental');return ['id'=>$x->id,'visit_no'=>$x->visit_number,'visit_date'=>$x->created_at,'diagnosis'=>$x->diagnosis ?: 'Consultation pending','symptoms'=>$x->symptoms,'doctor'=>$x->doctor ?: 'Medical Center','prescription'=>$rx?:null,'referred_to'=>$refs];})]);
    }
    public function notifications(Request $request) { return response()->json(['data'=>DB::table('notifications')->where('user_id',$request->user()->id)->orderByDesc('created_at')->get()]); }
    public function readNotification(Request $request,int $id) { DB::table('notifications')->where(['id'=>$id,'user_id'=>$request->user()->id])->update(['read'=>true,'updated_at'=>now()]); return response()->json(['data'=>['id'=>$id,'read'=>true]]); }
    public function uploadPhoto(Request $request) {
        abort_unless($request->user()->person_id, 404); $request->validate(['photo'=>'required|image|max:2048']);
        $person=DB::table('persons')->find($request->user()->person_id); if($person->photo_path) Storage::disk('public')->delete($person->photo_path);
        $path=$request->file('photo')->store('medical-card-photos','public'); DB::table('persons')->where('id',$person->id)->update(['photo_path'=>$path,'updated_at'=>now()]);
        return response()->json(['data'=>['photo_url'=>url(Storage::disk('public')->url($path))]]);
    }
    public function deletePhoto(Request $request) { abort_unless($request->user()->person_id, 404); $person=DB::table('persons')->find($request->user()->person_id); if($person->photo_path) Storage::disk('public')->delete($person->photo_path); DB::table('persons')->where('id',$person->id)->update(['photo_path'=>null,'updated_at'=>now()]); return response()->json(['data'=>['photo_url'=>null]]); }
    private function profile(int $id): array { $p=DB::table('persons')->find($id);$entry=$p->year_of_entry;if(!$entry){$source=$p->registration_number?:$p->student_number;if($source&&preg_match('/^(\d{2})/',$source,$m))$entry=((int)$m[1]<=50?2000:1900)+(int)$m[1];}return ['id'=>$p->id,'person_type'=>$p->person_type,'firstname'=>$p->first_name,'lastname'=>$p->last_name,'full_name'=>trim($p->first_name.' '.$p->last_name),'sex'=>$p->gender,'dob'=>$p->date_of_birth,'contact'=>$p->phone,'phone'=>$p->phone,'email'=>$p->email,'home_address'=>$p->address,'next_of_kin'=>$p->next_of_kin_name,'reg_no'=>$p->registration_number,'student_no'=>$p->student_number,'staff_number'=>$p->staff_number,'faculty'=>$p->faculty,'course'=>$p->course,'year_of_entry'=>$entry,'year_of_study'=>$p->year_of_study,'course_duration'=>$p->course_duration,'medical_card_no'=>$p->medical_card_number,'medical_card_expiry'=>$p->medical_card_expires_at,'medical_card_status'=>$p->medical_card_number?'issued':$p->verification_status,'photo_url'=>$p->photo_path?url(Storage::disk('public')->url($p->photo_path)):null]; }
}
