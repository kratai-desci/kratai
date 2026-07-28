@extends('layouts.app')

@section('title', 'User List')

@section('content')
<div class="container">
    <h1>Users</h1>
    
    @foreach($users as $user)
        <div class="user">
            <h2>{{ $user->name }}</h2>
            <p>{{ $user->email }}</p>
        </div>
    @empty
        <p>No users found.</p>
    @endforeach
    
    @include('partials.pagination')
</div>
@endsection
