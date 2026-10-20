<?php
namespace App\Http\Middleware;
use Closure;use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;use Illuminate\Support\Facades\Schema;
class AuditWrites {public function handle(Request $request,Closure $next){$response=$next($request);if($request->is('api/*')&&!in_array($request->method(),['GET','HEAD','OPTIONS'])&&$response->getStatusCode()<400&&Schema::hasTable('audit_logs'))DB::table('audit_logs')->insert(['user_id'=>$request->user()?->id,'action'=>strtolower($request->method()),'entity_type'=>'api_route','details'=>json_encode(['route'=>$request->path(),'status'=>$response->getStatusCode()]),'ip_address'=>$request->ip(),'created_at'=>now(),'updated_at'=>now()]);return $response;}}
