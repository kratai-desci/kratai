// Fixture for testing template detection in TypeScript
// Note: This file is a test fixture and doesn't need to be fully valid TypeScript

interface TemplateConfig {
    path: string;
}

// Class with template reference
class TaskComponent {
    private template: string = 'components/task.html';
    private config: TemplateConfig = {
        path: 'config/settings.html'
    };
    
    render(): void {
        fetch('/templates/task-list.html')
            .then((response: any) => response.text())
            .then((html: string) => {
                // renderHTML would be implemented
            });
    }
    
    loadTemplate(): Promise<string> {
        return fetch('templates/task-detail.html')
            .then((r: any) => r.text());
    }
}

// Function with template
function renderView(): string {
    const templatePath = 'views/main.html';
    return 'template content';
}

// Angular-style component decorator (string template)
function Component(config: any) {
    return function(target: any) {};
}

@Component({
    templateUrl: 'components/user-profile.html',
    styleUrls: ['styles/profile.css']
})
class UserProfileComponent {
    title = 'User Profile';
}

// HTML template as string (simulating require)
const formTemplate = 'forms/user-form.html';

export function FormComponent() {
    return formTemplate;
}
