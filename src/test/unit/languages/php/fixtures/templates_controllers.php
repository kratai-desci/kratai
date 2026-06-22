<?php
// Fixture for testing template detection in PHP

namespace App\Controllers;

// Laravel controller
class TaskController extends Controller
{
    public function index()
    {
        return view('tasks.index');
    }
    
    public function show($id)
    {
        return view('tasks.show', ['id' => $id]);
    }
    
    public function create()
    {
        // Blade template
        return view('tasks.create');
    }
}

// Symfony controller
class UserController
{
    public function profile()
    {
        return $this->render('user/profile.html.twig', [
            'user' => $user
        ]);
    }
    
    public function settings()
    {
        return $this->render('user/settings.html.twig');
    }
}

// Plain PHP with includes
class TemplateRenderer
{
    public function renderPage()
    {
        include 'templates/header.html';
        include 'templates/content.html';
        include 'templates/footer.html';
    }
    
    public function renderPartial($name)
    {
        $template = 'partials/' . $name . '.html';
        include $template;
    }
}

// Twig template rendering
class TwigController
{
    private $twig;
    
    public function index()
    {
        return $this->twig->render('pages/index.html.twig');
    }
    
    public function dashboard()
    {
        $template = 'dashboard/main.html.twig';
        return $this->twig->render($template);
    }
}
