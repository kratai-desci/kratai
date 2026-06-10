// Detailed test to check type extraction
const { CodeParserService } = require('./out/services/codeParserService');
const path = require('path');

async function checkTypes() {
    const workspacePath = path.join(__dirname, 'test-fixtures/all-languages');
    const diagramData = await CodeParserService.parseWorkspace(workspacePath);
    
    console.log('🔍 Checking Type Extraction:\n');
    
    diagramData.classes.forEach(cls => {
        const ext = cls.filePath.match(/\.(ts|js|py|php)$/)?.[1];
        const lang = {ts: 'TypeScript', js: 'JavaScript', py: 'Python', php: 'PHP'}[ext];
        
        console.log(`📦 ${cls.name} (${lang}) - ${cls.filePath}`);
        console.log(`   Properties:`);
        cls.properties.slice(0, 3).forEach(p => {
            console.log(`     - ${p.name}: ${p.type} (${p.visibility})`);
        });
        console.log('');
    });
}

checkTypes();
