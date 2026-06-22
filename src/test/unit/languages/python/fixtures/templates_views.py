"""
Fixture for testing template detection in Python web frameworks
"""
from django.shortcuts import render
from django.views.generic import ListView, DetailView
from flask import render_template
from fastapi.templating import Jinja2Templates

# Django class-based view
class TaskListView(ListView):
    template_name = 'tasks/list.html'
    model = Task

# Django function-based view
def task_detail(request, pk):
    task = get_object_or_404(Task, pk=pk)
    return render(request, 'tasks/detail.html', {'task': task})

# Flask view
def index():
    return render_template('index.html')

# FastAPI view
templates = Jinja2Templates(directory="templates")

async def read_item(request: Request):
    return templates.TemplateResponse("item.html", {"request": request})

# Multiple templates in one class
class UserProfileView(DetailView):
    template_name = "users/profile.html"
    
    def get_context_data(self):
        # Sometimes templates are referenced in strings
        fallback = "users/fallback.html"
        return super().get_context_data()
