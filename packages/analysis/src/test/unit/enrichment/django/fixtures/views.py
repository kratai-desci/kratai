from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from .models import Task

# List all tasks
class TaskListView(ListView):
    model = Task
    template_name = 'webapp/task_list.html'
    context_object_name = 'tasks'

# View single task details
class TaskDetailView(DetailView):
    model = Task
    template_name = 'webapp/task_detail.html'
    context_object_name = 'task'

# Create a new task
class TaskCreateView(CreateView):
    model = Task
    template_name = 'webapp/task_form.html'
    fields = ['title', 'description', 'completed']
    success_url = reverse_lazy('task_list')

# Update an existing task
class TaskUpdateView(UpdateView):
    model = Task
    template_name = 'webapp/task_form.html'
    fields = ['title', 'description', 'completed']
    success_url = reverse_lazy('task_list')

# Delete a task
class TaskDeleteView(DeleteView):
    model = Task
    template_name = 'webapp/task_confirm_delete.html'
    success_url = reverse_lazy('task_list')
