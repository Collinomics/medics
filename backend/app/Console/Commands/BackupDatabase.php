<?php
namespace App\Console\Commands;
use Illuminate\Console\Command;use Illuminate\Support\Facades\File;
class BackupDatabase extends Command {protected $signature='mcis:backup';protected $description='Create a timestamped backup of the local MCIS SQLite database';public function handle():int{if(config('database.default')!=='sqlite'){$this->error('Use the managed database backup service for non-SQLite production databases.');return self::FAILURE;}$source=config('database.connections.sqlite.database');$dir=storage_path('app/backups');File::ensureDirectoryExists($dir);$target=$dir.'/mcis-'.now()->format('Ymd-His').'.sqlite';File::copy($source,$target);$this->info($target);return self::SUCCESS;}}
