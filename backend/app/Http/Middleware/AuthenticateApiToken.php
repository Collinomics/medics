<?php
namespace App\Http\Middleware;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class AuthenticateApiToken {
 public function handle(Request $request, Closure $next) {
  $plain=$request->bearerToken();
  $token=$plain?DB::table('api_tokens')->where('token_hash',hash('sha256',$plain))->first():null;
  if(!$token||($token->expires_at&&now()->isAfter($token->expires_at))) return response()->json(['message'=>'Unauthenticated.'],401);
  $user=User::find($token->user_id);
  if(!$user||$user->status!=='active') return response()->json(['message'=>'Account is not active.'],403);
  $request->setUserResolver(fn()=>$user);
  return $next($request);
 }
}
