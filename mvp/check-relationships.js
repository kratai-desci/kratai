// Check relationships in detail
const { CodeParserService } = require('./out/services/codeParserService');
const path = require('path');

async function checkRelationships() {
    const workspacePath = path.join(__dirname, 'test-fixtures/all-languages');
    const diagramData = await CodeParserService.parseWorkspace(workspacePath);
    
    console.log('🔗 Detailed Relationship Analysis:\n');
    
    // Group relationships by type
    const byType = {
        uses: [],
        extends: [],
        implements: []
    };
    
    diagramData.relationships.forEach(rel => {
        byType[rel.type].push(rel);
    });
    
    console.log(`📊 Total: ${diagramData.relationships.length} relationships\n`);
    
    Object.entries(byType).forEach(([type, rels]) => {
        if (rels.length > 0) {
            console.log(`\n${type.toUpperCase()} (${rels.length}):`);
            rels.forEach(rel => {
                console.log(`   ${rel.from} → ${rel.to}`);
            });
        }
    });
    
    // Check for duplicates
    console.log('\n\n🔍 Checking for duplicates:');
    const relStrings = diagramData.relationships.map(r => `${r.from}-${r.type}-${r.to}`);
    const uniqueRels = new Set(relStrings);
    
    if (relStrings.length !== uniqueRels.size) {
        console.log(`⚠️  Found ${relStrings.length - uniqueRels.size} duplicate relationship(s):`);
        const counts = {};
        relStrings.forEach(r => {
            counts[r] = (counts[r] || 0) + 1;
        });
        Object.entries(counts).forEach(([rel, count]) => {
            if (count > 1) {
                console.log(`   ${rel} appears ${count} times`);
            }
        });
    } else {
        console.log('✅ No duplicate relationships found');
    }
    
    // Expected relationships per language
    console.log('\n\n📋 Expected relationships by language:');
    console.log('   TypeScript:');
    console.log('     - ProductController → ProductService (uses)');
    console.log('     - ProductController → Product (uses, for types)');
    console.log('     - ProductService → Product (uses)');
    console.log('     - Product → IProduct (implements)');
    console.log('   JavaScript:');
    console.log('     - ProductController → ProductService (uses)');
    console.log('     - ProductService → Product (uses)');
    console.log('   Python:');
    console.log('     - ProductController → ProductService (uses)');
    console.log('     - ProductService → Product (uses)');
    console.log('   PHP:');
    console.log('     - ProductController → ProductService (uses)');
    console.log('     - ProductService → Product (uses)');
    console.log('   \n   Expected total: 10 unique relationships');
}

checkRelationships();
