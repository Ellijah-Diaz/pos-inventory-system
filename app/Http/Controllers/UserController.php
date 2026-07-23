<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->string('search')->toString();
        $role   = $request->string('role')->toString();

        $users = User::query()
            ->when($search, fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"))
            ->when(in_array($role, ['admin', 'cashier'], true), fn ($q) => $q->where('role', $role))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Users/Index', [
            'users'   => $users,
            'filters' => ['search' => $search, 'role' => $role ?: null],
            'stats'   => [
                'total'    => User::count(),
                'admins'   => User::where('role', 'admin')->count(),
                'cashiers' => User::where('role', 'cashier')->count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'confirmed', Password::defaults()],
            'role'      => ['required', 'in:admin,cashier'],
            'is_active' => ['boolean'],
        ]);

        User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'role'      => $data['role'],
            'is_active' => $data['is_active'] ?? true,
        ]);

        return back()->with('success', 'User created.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password'  => ['nullable', 'confirmed', Password::defaults()],
            'role'      => ['required', 'in:admin,cashier'],
            'is_active' => ['boolean'],
        ]);

        // Prevent admins from locking themselves out (demote / deactivate self)
        if ($user->id === $request->user()->id) {
            if ($data['role'] !== 'admin') {
                return back()->withErrors(['role' => 'You cannot change your own role.']);
            }
            if (! ($data['is_active'] ?? true)) {
                return back()->withErrors(['is_active' => 'You cannot deactivate your own account.']);
            }
        }

        $user->fill([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'role'      => $data['role'],
            'is_active' => $data['is_active'] ?? $user->is_active,
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return back()->with('success', 'User updated.');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['user' => 'You cannot delete your own account.']);
        }

        $user->delete();

        return back()->with('success', 'User deleted.');
    }
}
