// Simulate the full diagram generation flow
const { CodeParserService } = require('./out/services/codeParserService');
const path = require('path');

async function simulateDiagramGeneration() {
    const workspacePath = path.join(__dirname, 'test-fixtures/all-languages');
    
    console.log('🎨 Simulating Diagram Generation Flow...\n');
    
    // Parse workspace
    const diagramData = await CodeParserService.parseWorkspace(workspacePath);
    console.log(`Step 1: Parsed ${diagramData.classes.length} classes`);
    console.log(`Step 1: Found ${diagramData.relationships.length} relationships\n`);
    
    // Simulate relationship filtering (from generateClassDiagram.ts)
    const validClassIds = new Set(diagramData.classes.map(c => `${c.filePath}:${c.name}`));
    console.log(`Step 2: Built validClassIds set with ${validClassIds.size} IDs`);
    console.log('Sample IDs:');
    Array.from(validClassIds).slice(0, 3).forEach(id => console.log(`  - ${id}`));
    
    const beforeFilter = diagramData.relationships.length;
    diagramData.relationships = diagramData.relationships.filter(rel => 
        validClassIds.has(rel.from) && validClassIds.has(rel.to)
    );
    console.log(`\nStep 3: Filtered relationships: ${beforeFilter} → ${diagramData.relationships.length}`);
    
    if (diagramData.relationships.length === 0) {
        console.log('\n❌ ERROR: All relationships filtered out!');
        console.log('\nSample relationship:');
        const sampleRel = await CodeParserService.parseWorkspace(workspacePath).then(d => d.relationships[0]);
        if (sampleRel) {
            console.log(`  from: ${sampleRel.from}`);
            console.log(`  to: ${sampleRel.to}`);
            console.log(`  from in set: ${validClassIds.has(sampleRel.from)}`);
            console.log(`  to in set: ${validClassIds.has(sampleRel.to)}`);
        }
    } else {
        console.log('\n✅ SUCCESS: Relationships preserved!');
        console.log('\nFinal relationships:');
        diagramData.relationships.forEach(rel => {
            console.log(`  ${rel.from.split(':')[1]} → ${rel.to.split(':')[1]} (${rel.type})`);
        });
    }
    
    console.log(`\n📊 Final Summary:`);
    console.log(`   Classes: ${diagramData.classes.length}`);
    console.log(`   Relationships: ${diagramData.relationships.length}`);
}

simulateDiagramGeneration();
