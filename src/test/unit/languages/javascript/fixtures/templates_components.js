// Fixture for testing template detection in JavaScript
import template from './page.html';
import { renderTemplate } from './utils';

// Import template
const userTemplate = require('./user.html');

// Class with template reference
class UserComponent {
    constructor() {
        this.template = 'components/user.html';
    }
    
    render() {
        fetch('/templates/profile.html')
            .then(response => response.text())
            .then(html => {
                this.element.innerHTML = html;
            });
    }
}

// Function with template
function renderPage() {
    return renderTemplate('pages/home.html', { title: 'Home' });
}

// Template in object literal
const config = {
    mainTemplate: 'layouts/main.html',
    errorTemplate: 'errors/404.html'
};

// Dynamic template loading
async function loadDynamicTemplate() {
    const templatePath = 'dynamic/template.html';
    return await import(templatePath);
}
