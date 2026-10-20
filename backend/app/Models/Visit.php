<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Visit extends Model { protected $guarded=[]; protected $table='visits'; public function person(){return $this->belongsTo(Person::class);} }
