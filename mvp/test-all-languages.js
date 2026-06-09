// Test all language parsers on unified fixture
const { CodeParserService } = require('./out/services/codeParserService');
const path = require('path');

async function testAllLanguages() {
    const workspacePath = path.join(__dirname, 'test-fixtures/all-languages');
    
    console.log('🌍 Testing All Language Parsers...');
    console.log(`📂 Workspace: ${workspacePath}\n`);
    
    try {
        const diagramData = await CodeParserService.parseWorkspace(workspacePath);
        
        console.log(`✅ Found ${diagramData.classes.length} classes:\n`);
        
        // Group by language
        const byLanguage = {
            TypeScript: [],
            JavaScript: [],
            Python: [],
            PHP: []
        };
        
        diagramData.classes.forEach(cls => {
            const ext = cls.filePath.match(/\.(ts|js|py|php)$/)?.[1];
            if (ext === 'ts') byLanguage.TypeScript.push(cls);
            else if (ext === 'js') byLanguage.JavaScript.push(cls);
            else if (ext === 'py') byLanguage.Python.push(cls);
            else if (ext === 'php') byLanguage.PHP.push(cls);
        });
        
        // Print summary by language
        Object.entries(byLanguage).forEach(([lang, classes]) => {
            console.log(`📦 ${lang}: ${classes.length} classes`);
            classes.forEach(cls => {
                console.log(`   - ${cls.name} (${cls.properties.length} props, ${cls.methods.length} methods)`);
            });
            console.log('');
        });
        
        console.log(`🔗 Found ${diagramData.relationships.length} relationships:\n`);
        diagramData.relationships.forEach(rel => {
            console.log(`   ${rel.from} --${rel.type}--> ${rel.to}`);
        });
        
        console.log('\n✨ Multi-language parser test complete!');
        console.log(`\n📊 Summary:`);
        console.log(`   TypeScript: ${byLanguage.TypeScript.length} classes`);
        console.log(`   JavaScript: ${byLanguage.JavaScript.length} classes`);
        console.log(`   Python: ${byLanguage.Python.length} classes`);
        console.log(`   PHP: ${byLanguage.PHP.length} classes`);
        console.log(`   Total: ${diagramData.classes.length} classes`);
        console.log(`   Relationships: ${diagramData.relationships.length}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testAllLanguages();
