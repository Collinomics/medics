<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemSettings
{
    public const OPERATIONAL_DEFAULTS = [
        'centre_name' => 'Kyambogo University Medical Center',
        'centre_email' => '', 'centre_phone' => '', 'centre_address' => '',
        'registration_auto_approve' => false,
        'card_number_prefix' => 'MC', 'default_card_validity_years' => 4,
        'queue_prefix' => 'Q', 'daily_patient_limit' => 250,
        'low_stock_threshold' => 20, 'expiry_warning_days' => 90,
        'allow_partial_dispensing' => true,
        'session_duration_hours' => 12,
        'announcement_enabled' => false, 'announcement_message' => '',
        'maintenance_mode' => false, 'maintenance_message' => 'The system is temporarily undergoing maintenance.',
    ];

    public static function get(string $key, array $defaults = []): array
    {
        if (!Schema::hasTable('system_settings')) return $defaults;
        $stored = DB::table('system_settings')->where('key', $key)->value('value');
        return array_replace($defaults, $stored ? (json_decode($stored, true) ?: []) : []);
    }

    public static function operational(): array
    {
        return self::get('operational', self::OPERATIONAL_DEFAULTS);
    }
}
