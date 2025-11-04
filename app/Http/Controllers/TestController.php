<?php

namespace App\Http\Controllers;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function manager(): Response
    {
        return Inertia::render('Manager/Members');
    }

    public function admin(): Response
    {
        return Inertia::render('Admin/System');
    }
}
