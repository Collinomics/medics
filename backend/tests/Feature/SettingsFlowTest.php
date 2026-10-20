<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SettingsFlowTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $role): array
    {
        $user = User::create(['username' => $role.uniqid(), 'name' => 'Settings User', 'email' => $role.'@test.local', 'role' => $role, 'status' => 'active', 'password' => 'password']);
        $token = $role.'-settings-token';
        DB::table('api_tokens')->insert(['user_id' => $user->id, 'token_hash' => hash('sha256', $token), 'created_at' => now(), 'updated_at' => now()]);
        return [$user, $token];
    }

    public function test_user_can_update_account_preferences_and_password(): void
    {
        [$user, $token] = $this->account('doctor');
        $this->withToken($token)->putJson('/api/settings/account', [
            'name' => 'Dr Settings', 'email' => 'settings@test.local', 'notifications_enabled' => false,
        ])->assertOk()->assertJsonPath('data.notifications_enabled', false);

        $this->withToken($token)->putJson('/api/settings/password', [
            'current_password' => 'password', 'password' => 'new-password', 'password_confirmation' => 'new-password',
        ])->assertOk();
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }

    public function test_only_admin_can_change_medical_card_settings(): void
    {
        [, $doctorToken] = $this->account('doctor');
        [, $adminToken] = $this->account('admin');
        $payload = [
            'institution_name' => 'KYAMBOGO UNIVERSITY', 'card_title' => 'STUDENT MEDICAL CARD',
            'faculty_colors' => ['default' => ['bg' => '#ffffff', 'border' => '#0000ff', 'text' => '#000000']],
        ];
        $this->withToken($doctorToken)->putJson('/api/settings/medical-card', $payload)->assertForbidden();
        $this->withToken($adminToken)->putJson('/api/settings/medical-card', $payload)->assertOk()->assertJsonPath('data.faculty_colors.default.bg', '#ffffff');
        $this->withToken($doctorToken)->getJson('/api/settings/medical-card')->assertOk()->assertJsonPath('data.institution_name', 'KYAMBOGO UNIVERSITY');
    }
}
