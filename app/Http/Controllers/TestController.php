<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    public function manager():Response {
        return Inertia::render('Manager/Users');
    }

    public function admin():Response {
        return Inertia::render('Admin/System');
    }
}
