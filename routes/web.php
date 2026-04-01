<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::view('/onboarding', 'welcome');
Route::view('/dashboard', 'welcome');
Route::view('/school-admin', 'welcome');
Route::view('/school-admin/login', 'welcome');
Route::view('/school-admin/dashboard', 'welcome');
Route::view('/school-admin/sessions', 'welcome');
Route::view('/school-admin/terms', 'welcome');
Route::view('/school-admin/classes', 'welcome');
Route::view('/school-admin/teachers', 'welcome');
Route::view('/school-admin/subjects', 'welcome');
Route::view('/school-admin/settings', 'welcome');
Route::view('/school-admin/profile', 'welcome');
Route::view('/super-admin', 'welcome');
Route::view('/super-admin/login', 'welcome');
Route::view('/super-admin/dashboard', 'welcome');
Route::view('/super-admin/tenants', 'welcome');
Route::view('/super-admin/tenants/new', 'welcome');
Route::view('/super-admin/plans', 'welcome');
Route::view('/super-admin/audit-logs', 'welcome');
Route::view('/super-admin/settings', 'welcome');
