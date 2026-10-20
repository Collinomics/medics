<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(['username' => 'admin'], [
            'name' => 'MCIS Administrator', 'email' => 'admin@kyu.ac.ug',
            'role' => 'admin', 'status' => 'active', 'password' => 'password',
        ]);
        User::updateOrCreate(['username' => 'doctor'], [
            'name' => 'Dr. Paul Okullo', 'email' => 'doctor@kyu.ac.ug',
            'role' => 'doctor', 'status' => 'active', 'password' => 'password',
        ]);
        foreach ([
            ['username' => 'lab', 'name' => 'Laboratory Officer', 'role' => 'lab'],
            ['username' => 'pharmacist', 'name' => 'Pharmacy Officer', 'role' => 'pharmacy'],
            ['username' => 'injection', 'name' => 'Injection Nurse', 'role' => 'injection'],
            ['username' => 'dental', 'name' => 'Dental Officer', 'role' => 'dental'],
            ['username' => 'records', 'name' => 'Records Officer', 'role' => 'records'],
        ] as $staff) {
            User::updateOrCreate(['username' => $staff['username']], [...$staff, 'status' => 'active', 'password' => 'password']);
        }
        foreach ([
            ['name' => 'Paracetamol 500mg', 'category' => 'Analgesic', 'unit' => 'tablets', 'location' => 'Pharmacy', 'stock_qty' => 200, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Amoxicillin 500mg', 'category' => 'Antibiotic', 'unit' => 'capsules', 'location' => 'Pharmacy', 'stock_qty' => 120, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tetanus toxoid', 'category' => 'Vaccine', 'unit' => 'vials', 'location' => 'Injection Room', 'stock_qty' => 30, 'created_at' => now(), 'updated_at' => now()],
        ] as $drug) {
            DB::table('drugs')->updateOrInsert(['name' => $drug['name']], $drug);
        }
        foreach ([
            ['test_name' => 'Malaria test', 'description' => 'Malaria parasite screening', 'created_at' => now(), 'updated_at' => now()],
            ['test_name' => 'Full blood count', 'description' => 'Complete blood count', 'created_at' => now(), 'updated_at' => now()],
        ] as $test) {
            DB::table('lab_tests')->updateOrInsert(['test_name' => $test['test_name']], $test);
        }
    }
}
