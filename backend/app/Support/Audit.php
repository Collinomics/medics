<?php
namespace App\Support;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class Audit { public static function record(Request $r,string $action,string $type,?int $id=null,array $details=[]):void {DB::table('audit_logs')->insert(['user_id'=>$r->user()?->id,'action'=>$action,'entity_type'=>$type,'entity_id'=>$id,'details'=>json_encode($details),'ip_address'=>$r->ip(),'created_at'=>now(),'updated_at'=>now()]);} }
