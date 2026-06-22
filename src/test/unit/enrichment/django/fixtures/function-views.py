from django.shortcuts import render, get_object_or_404, redirect
from .models import Task

# Function-based view - List all tasks
def task_list(request):
    tasks = Task.objects.all()
    return render(request, 'webapp/task_list.html', {'tasks': tasks})

# Function-based view - View task details  
def task_detail(request, pk):
    task = get_object_or_404(Task, pk=pk)
    return render(request, 'webapp/task_detail.html', {'task': task})

# Function-based view - Create task
def task_create(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'webapp/task_form.html')

# Function-based view - Edit task
def task_edit(request, pk):
    task = get_object_or_404(Task, pk=pk)
    return render(request, 'webapp/task_form.html', {'task': task})

# Function-based view - Delete task
def task_delete(request, pk):
    task = get_object_or_404(Task, pk=pk)
    if request.method == 'POST':
        task.delete()
        return redirect('task_list')
    return render(request, 'webapp/task_confirm_delete.html', {'task': task})
