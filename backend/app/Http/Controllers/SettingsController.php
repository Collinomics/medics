<?php

namespace App\Http\Controllers;

use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Support\SystemSettings;

class SettingsController extends Controller
{
    private const DEFAULT_CARD_SETTINGS = [
        'institution_name' => 'KYAMBOGO UNIVERSITY',
        'card_title' => 'STUDENT MEDICAL CARD',
        'faculty_colors' => [
            'Faculty of Engineering' => ['bg' => '#fef3c7', 'border' => '#b45309', 'text' => '#78350f'],
            'Faculty of Computing and Informatics' => ['bg' => '#dbeafe', 'border' => '#1d4ed8', 'text' => '#1e3a8a'],
            'Faculty of Education' => ['bg' => '#dcfce7', 'border' => '#15803d', 'text' => '#14532d'],
            'Faculty of Health Sciences' => ['bg' => '#fce7f3', 'border' => '#be185d', 'text' => '#831843'],
            'Faculty of Law' => ['bg' => '#ede9fe', 'border' => '#6d28d9', 'text' => '#4c1d95'],
            'Faculty of Science' => ['bg' => '#cffafe', 'border' => '#0e7490', 'text' => '#164e63'],
            'Faculty of Business and Management' => ['bg' => '#fef9c3', 'border' => '#a16207', 'text' => '#713f12'],
            'Faculty of Arts and Social Sciences' => ['bg' => '#ffedd5', 'border' => '#c2410c', 'text' => '#7c2d12'],
            'School of Postgraduate Studies' => ['bg' => '#f1f5f9', 'border' => '#334155', 'text' => '#0f172a'],
            'default' => ['bg' => '#fce4ec', 'border' => '#9d174d', 'text' => '#831843'],
        ],
    ];

    public function account(Request $request)
    {
        return response()->json(['data' => $this->accountData($request->user())]);
    }

    public function updateAccount(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => 'required|string|max:120',
            'email' => 'nullable|email|max:160|unique:users,email,'.$user->id,
            'notifications_enabled' => 'required|boolean',
        ]);
        $user->update([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'preferences' => ['notifications_enabled' => $data['notifications_enabled']],
        ]);
        Audit::record($request, 'updated_account_settings', 'user', $user->id);
        return response()->json(['data' => $this->accountData($user->fresh())]);
    }

    public function password(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        abort_unless(Hash::check($data['current_password'], $request->user()->password), 422, 'The current password is incorrect.');
        $request->user()->update(['password' => $data['password']]);
        DB::table('api_tokens')->where('user_id', $request->user()->id)->where('token_hash', '!=', hash('sha256', (string) $request->bearerToken()))->delete();
        Audit::record($request, 'changed_password', 'user', $request->user()->id);
        return response()->json(['data' => ['message' => 'Password changed successfully.']]);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:2048']);
        $user = $request->user();
        if ($user->photo_path) Storage::disk('public')->delete($user->photo_path);
        $path = $request->file('photo')->store('account-photos', 'public');
        $user->update(['photo_path' => $path]);
        if ($user->person_id) DB::table('persons')->where('id', $user->person_id)->update(['photo_path' => $path, 'updated_at' => now()]);
        return response()->json(['data' => $this->accountData($user->fresh())]);
    }

    public function deletePhoto(Request $request)
    {
        $user = $request->user();
        $personPhoto = $user->person_id ? DB::table('persons')->where('id', $user->person_id)->value('photo_path') : null;
        $photoPath = $user->photo_path ?: $personPhoto;
        if ($photoPath) Storage::disk('public')->delete($photoPath);
        $user->update(['photo_path' => null]);
        if ($user->person_id) DB::table('persons')->where('id', $user->person_id)->update(['photo_path' => null, 'updated_at' => now()]);
        return response()->json(['data' => $this->accountData($user->fresh())]);
    }

    public function cardSettings()
    {
        $stored = DB::table('system_settings')->where('key', 'medical_card')->value('value');
        return response()->json(['data' => $stored ? json_decode($stored, true) : self::DEFAULT_CARD_SETTINGS]);
    }

    public function updateCardSettings(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate([
            'institution_name' => 'required|string|max:100',
            'card_title' => 'required|string|max:100',
            'faculty_colors' => 'required|array',
            'faculty_colors.*.bg' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'faculty_colors.*.border' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'faculty_colors.*.text' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);
        DB::table('system_settings')->updateOrInsert(['key' => 'medical_card'], [
            'value' => json_encode($data), 'updated_by' => $request->user()->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        Audit::record($request, 'updated_medical_card_settings', 'system_setting', null);
        return response()->json(['data' => $data]);
    }

    public function operational()
    {
        return response()->json(['data' => SystemSettings::operational()]);
    }

    public function updateOperational(Request $request)
    {
        abort_unless($request->user()->role === 'admin', 403);
        $data = $request->validate([
            'centre_name' => 'required|string|max:120', 'centre_email' => 'nullable|email|max:160',
            'centre_phone' => 'nullable|string|max:30', 'centre_address' => 'nullable|string|max:240',
            'registration_auto_approve' => 'required|boolean', 'card_number_prefix' => ['required','string','max:10','regex:/^[A-Z0-9-]+$/'],
            'default_card_validity_years' => 'required|integer|min:1|max:10', 'queue_prefix' => ['required','string','max:5','regex:/^[A-Z0-9-]+$/'],
            'daily_patient_limit' => 'required|integer|min:1|max:5000', 'low_stock_threshold' => 'required|integer|min:1|max:10000',
            'expiry_warning_days' => 'required|integer|min:1|max:730', 'allow_partial_dispensing' => 'required|boolean',
            'session_duration_hours' => 'required|integer|min:1|max:168', 'announcement_enabled' => 'required|boolean',
            'announcement_message' => 'nullable|string|max:500', 'maintenance_mode' => 'required|boolean',
            'maintenance_message' => 'nullable|string|max:500',
        ]);
        DB::table('system_settings')->updateOrInsert(['key' => 'operational'], [
            'value' => json_encode($data), 'updated_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now(),
        ]);
        Audit::record($request, 'updated_operational_settings', 'system_setting', null);
        return response()->json(['data' => $data]);
    }

    private function accountData($user): array
    {
        $preferences = is_array($user->preferences) ? $user->preferences : (json_decode($user->preferences ?: '{}', true) ?: []);
        $personPhoto = $user->person_id ? DB::table('persons')->where('id', $user->person_id)->value('photo_path') : null;
        $photoPath = $user->photo_path ?: $personPhoto;
        return [
            'id' => $user->id, 'name' => $user->name, 'username' => $user->username,
            'email' => $user->email, 'role' => $user->role, 'department' => $user->department,
            'photo_url' => $photoPath ? url(Storage::disk('public')->url($photoPath)) : null,
            'notifications_enabled' => $preferences['notifications_enabled'] ?? true,
        ];
    }
}
