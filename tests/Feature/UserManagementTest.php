<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lets an admin create a user', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post('/users', [
        'name'                  => 'New Cashier',
        'email'                 => 'new@pos.test',
        'role'                  => 'cashier',
        'password'              => 'password123',
        'password_confirmation' => 'password123',
        'is_active'             => true,
    ])->assertRedirect();

    $this->assertDatabaseHas('users', ['email' => 'new@pos.test', 'role' => 'cashier']);
});

it('forbids cashiers from accessing user management', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);

    $this->actingAs($cashier)->get('/users')->assertForbidden();
    $this->actingAs($cashier)->post('/users', [])->assertForbidden();
});

it('blocks public registration route', function () {
    $this->get('/register')->assertNotFound();
});

it('prevents a deactivated user from logging in', function () {
    $user = User::factory()->create([
        'email'     => 'off@pos.test',
        'password'  => bcrypt('password123'),
        'is_active' => false,
    ]);

    $this->post('/login', ['email' => 'off@pos.test', 'password' => 'password123'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('stops an admin from deleting their own account', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->delete("/users/{$admin->id}")->assertSessionHasErrors('user');

    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});
