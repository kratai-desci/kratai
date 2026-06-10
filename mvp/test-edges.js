// Test edge generation with real data
const { CodeParserService } = require('./out/services/codeParserService');
const { DiagramGeneratorService } = require('./out/services/diagramGeneratorService');
const path = require('path');

async function testEdgeGeneration() {
    const workspacePath = path.join(__dirname, 'test-fixtures/all-languages');
    
    console.log('🔍 Testing Edge Generation...\n');
    
    // Parse workspace
    const diagramData = await CodeParserService.parseWorkspace(workspacePath);
    
    // Filter relationships (same as generateClassDiagram.ts)
    const validClassIds = new Set(diagramData.classes.map(c => `${c.filePath}__${c.name}`));
    diagramData.relationships = diagramData.relationships.filter(rel => 
        validClassIds.has(rel.from) && validClassIds.has(rel.to)
    );
    
    // Generate nodes and edges
    const { nodes, edges } = DiagramGeneratorService.generateReactFlowData(diagramData);
    
    console.log(`📦 Generated ${nodes.length} nodes`);
    console.log(`🔗 Generated ${edges.length} edges\n`);
    
    // Get all node IDs
    const nodeIds = new Set(nodes.map(n => n.id));
    
    console.log('Sample node IDs:');
    Array.from(nodeIds).slice(0, 3).forEach(id => console.log(`  - ${id}`));
    
    console.log('\nSample edges:');
    edges.slice(0, 3).forEach(edge => {
        console.log(`  ${edge.source} → ${edge.target}`);
        console.log(`    source exists: ${nodeIds.has(edge.source)}`);
        console.log(`    target exists: ${nodeIds.has(edge.target)}`);
    });
    
    // Check for broken edges
    let brokenEdges = 0;
    edges.forEach(edge => {
        if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
            brokenEdges++;
            console.log(`\n❌ BROKEN EDGE:`);
            console.log(`   source: ${edge.source} (exists: ${nodeIds.has(edge.source)})`);
            console.log(`   target: ${edge.target} (exists: ${nodeIds.has(edge.target)})`);
        }
    });
    
    if (brokenEdges === 0) {
        console.log('\n✅ All edges connect to existing nodes!');
    } else {
        console.log(`\n❌ Found ${brokenEdges} broken edges!`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Nodes: ${nodes.length}`);
    console.log(`   Edges: ${edges.length}`);
    console.log(`   Broken: ${brokenEdges}`);
}

testEdgeGeneration();
