<?php

namespace App\Http\Controllers;
use App\Support\SystemSettings;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    private function requireRole(Request $request, array $roles): void { abort_unless(in_array($request->user()->role, $roles), 403); }
    private function reconcileVisit(int $visitId): void {
        $pending = DB::table('lab_requests')->where('visit_id',$visitId)->where('status','pending')->exists()
            || DB::table('prescriptions')->where('visit_id',$visitId)->whereIn('status',['pending','partial'])->exists()
            || DB::table('injection_orders')->where('visit_id',$visitId)->where('status','pending')->exists()
            || DB::table('referrals')->where('visit_id',$visitId)->where('status','pending')->exists();
        if(!$pending) DB::table('visits')->where('id',$visitId)->update(['status'=>'ready_for_review','updated_at'=>now()]);
    }

    public function labRequests(Request $request) {
        $this->requireRole($request, ['lab', 'admin']);
        $q = DB::table('lab_requests as l')->join('lab_tests as t', 't.id', '=', 'l.test_id')->join('visits as v', 'v.id', '=', 'l.visit_id')->join('persons as p', 'p.id', '=', 'v.person_id')->join('users as u', 'u.id', '=', 'l.requested_by')
            ->select('l.*', 't.test_name', DB::raw("p.first_name || ' ' || p.last_name as patient_name"), 'u.name as requested_by');
        if ($request->status && $request->status !== 'all') $q->where('l.status', $request->status);
        return response()->json(['data' => $q->orderByDesc('l.created_at')->get()->map(fn($x) => [...(array)$x, 'request_no' => 'LR-'.now()->year.'-'.str_pad($x->id, 4, '0', STR_PAD_LEFT), 'request_date' => $x->created_at])]);
    }

    public function completeLab(Request $request, int $id) {
        $this->requireRole($request, ['lab', 'admin']);
        $data = $request->validate(['result' => 'required|string', 'remarks' => 'nullable|string']);
        $item = DB::table('lab_requests')->where('id', $id)->where('status', 'pending')->first(); abort_unless($item, 404);
        DB::table('lab_requests')->where('id', $id)->update([...$data, 'status' => 'completed', 'updated_at' => now()]);
        $uid=DB::table('visits as v')->join('users as u','u.person_id','=','v.person_id')->where('v.id',$item->visit_id)->value('u.id');if($uid)DB::table('notifications')->insert(['user_id'=>$uid,'message'=>'A laboratory result is now available in your visit history.','created_at'=>now(),'updated_at'=>now()]);
        $this->reconcileVisit($item->visit_id);
        return response()->json(['data' => DB::table('lab_requests')->find($id)]);
    }

    public function prescriptions(Request $request) {
        $this->requireRole($request, ['pharmacy', 'admin']);
        $q = DB::table('prescriptions as r')->join('visits as v', 'v.id', '=', 'r.visit_id')->join('persons as p', 'p.id', '=', 'v.person_id')->join('users as u', 'u.id', '=', 'r.doctor_id')->select('r.*', DB::raw("p.first_name || ' ' || p.last_name as patient_name"), 'u.name as doctor');
        if ($request->status && $request->status !== 'all') $q->where('r.status', $request->status);
        $items = DB::table('prescription_items as i')->join('drugs as d', 'd.id', '=', 'i.drug_id')->select('i.*', 'd.name as drug_name')->get()->groupBy('prescription_id');
        return response()->json(['data' => $q->orderByDesc('r.created_at')->get()->map(fn($x) => [...(array)$x, 'prescription_no' => 'RX-'.now()->year.'-'.str_pad($x->id, 4, '0', STR_PAD_LEFT), 'items' => $items[$x->id] ?? []])]);
    }

    public function dispense(Request $request, int $id) {
        $this->requireRole($request, ['pharmacy', 'admin']);
        $requested = collect($request->validate(['items'=>'nullable|array','items.*.item_id'=>'required|integer','items.*.quantity'=>'required|integer|min:0','items.*.status'=>'nullable|in:dispensed,partial,unavailable','items.*.notes'=>'nullable|string'])['items'] ?? [])->keyBy('item_id');
        $visitId = DB::transaction(function () use ($request, $id, $requested) {
            $rx = DB::table('prescriptions')->where('id', $id)->whereIn('status', ['pending','partial'])->first(); abort_unless($rx, 404);
            $items = DB::table('prescription_items')->where('prescription_id', $id)->get();
            foreach ($items as $item) {
                $choice=$requested->get($item->id); $total=$choice ? min((int)$choice['quantity'],$item->quantity) : $item->quantity; $quantity=max(0,$total-$item->dispensed_quantity);
                abort_if(!SystemSettings::operational()['allow_partial_dispensing'] && $total < $item->quantity, 422, 'Partial dispensing is disabled by the administrator.');
                $drug = DB::table('drugs')->where('id', $item->drug_id)->lockForUpdate()->first();
                abort_if(!$drug || $drug->stock_qty < $quantity, 422, "Insufficient stock for prescription item {$item->id}");
                if($quantity) {DB::table('drugs')->where('id', $drug->id)->decrement('stock_qty', $quantity, ['updated_at' => now()]);DB::table('stock_movements')->insert(['drug_id'=>$drug->id,'prescription_id'=>$id,'quantity'=>-$quantity,'type'=>'dispense','recorded_by'=>$request->user()->id,'created_at'=>now(),'updated_at'=>now()]);}
                $state=$total===0?'unavailable':($total<$item->quantity?'partial':'dispensed');
                DB::table('prescription_items')->where('id',$item->id)->update(['dispensed_quantity'=>$total,'dispensing_status'=>$choice['status']??$state,'dispensing_notes'=>$choice['notes']??null,'updated_at'=>now()]);
            }
            $partial=DB::table('prescription_items')->where('prescription_id',$id)->where('dispensing_status','!=','dispensed')->exists();
            DB::table('prescriptions')->where('id', $id)->update(['status'=>$partial?'partial':'dispensed', 'updated_at'=>now()]); return $rx->visit_id;
        });
        $this->reconcileVisit($visitId); return response()->json(['data' => DB::table('prescriptions')->find($id)]);
    }

    public function injectionOrders(Request $request) {
        $this->requireRole($request, ['injection', 'admin']);
        $q = DB::table('injection_orders as i')->join('visits as v', 'v.id', '=', 'i.visit_id')->join('persons as p', 'p.id', '=', 'v.person_id')->join('users as u', 'u.id', '=', 'i.ordered_by')->select('i.*', DB::raw("p.first_name || ' ' || p.last_name as patient_name"), 'u.name as doctor');
        if ($request->status && $request->status !== 'all') $q->where('i.status', $request->status);
        return response()->json(['data' => $q->orderByDesc('i.created_at')->get()->map(fn($x) => [...(array)$x, 'order_no' => 'INJ-'.now()->year.'-'.str_pad($x->id, 4, '0', STR_PAD_LEFT), 'time' => $x->created_at])]);
    }

    public function completeInjection(Request $request, int $id) {
        $this->requireRole($request, ['injection', 'admin']);
        $data = $request->validate(['drug' => 'required|string', 'remarks' => 'nullable|string', 'discharged_to' => 'required|in:discharged,pharmacy,doctor']);
        $status = $data['discharged_to'] === 'pharmacy' ? 'forwarded' : 'done';
        $item = DB::table('injection_orders')->where('id', $id)->where('status', 'pending')->first(); abort_unless($item, 404);
        DB::table('injection_orders')->where('id', $id)->update([...$data, 'status'=>$status, 'completed_by'=>$request->user()->id, 'completed_at'=>now(), 'updated_at'=>now()]);
        DB::table('visits')->where('id', $item->visit_id)->update(['status' => $data['discharged_to'] === 'doctor' ? 'waiting_review' : 'completed', 'updated_at' => now()]);
        if($data['discharged_to']==='doctor') $this->reconcileVisit($item->visit_id);
        return response()->json(['data' => ['id' => $id, 'status' => $status]]);
    }

    public function referrals(Request $request) {
        $this->requireRole($request,['dental','admin']);$q=DB::table('referrals as r')->join('visits as v','v.id','=','r.visit_id')->join('persons as p','p.id','=','v.person_id')->join('users as u','u.id','=','r.referred_by')->select('r.*',DB::raw("p.first_name || ' ' || p.last_name as patient_name"),'u.name as doctor');if($request->status&&$request->status!=='all')$q->where('r.status',$request->status);return response()->json(['data'=>$q->where('r.department','dental')->latest('r.created_at')->get()]);
    }
    public function completeReferral(Request $request,int $id) {$this->requireRole($request,['dental','admin']);$d=$request->validate(['outcome'=>'required|string','notes'=>'nullable|string']);$ref=DB::table('referrals')->where('id',$id)->where('status','pending')->first();abort_unless($ref,404);DB::table('referrals')->where('id',$id)->update([...$d,'status'=>'completed','completed_by'=>$request->user()->id,'completed_at'=>now(),'updated_at'=>now()]);$this->reconcileVisit($ref->visit_id);return response()->json(['data'=>DB::table('referrals')->find($id)]);}
}
