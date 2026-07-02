import * as assert from 'assert';
import * as path from 'path';
import { SpringBootEnricher } from '../../../../services/enrichment/frameworks/SpringBootEnricher';
import { ClassInfo } from '../../../../types/domain/ClassInfo';
import { EnrichmentContext } from '../../../../services/enrichment/AbstractEnricher';

suite('SpringBootEnricher - JSP File Linking', () => {
	const fixturesPath = path.join(__dirname, '../../../../../src/test/unit/enrichment/springboot/fixtures');
	let enricher: SpringBootEnricher;

	setup(() => {
		enricher = new SpringBootEnricher();
	});

	test('should link controllers to real JSP files instead of creating virtual views', async () => {
		// Setup: Include both controller and actual JSP files
		const mockClasses: ClassInfo[] = [
			{
				name: 'UserViewController',
				filePath: 'UserViewController.java',
				properties: [],
				methods: [],
				classType: 'class'
			},
			// Real JSP files parsed by HTMLParser
			{
				name: 'list.jsp',
				filePath: 'users/list.jsp',
				properties: [],
				methods: [],
				classType: 'template'
			},
			{
				name: 'view.jsp',
				filePath: 'users/view.jsp',
				properties: [],
				methods: [],
				classType: 'template'
			},
			{
				name: 'form.jsp',
				filePath: 'users/form.jsp',
				properties: [],
				methods: [],
				classType: 'template'
			}
		];
		
		const context: EnrichmentContext = {
			workspacePath: fixturesPath,
			classes: mockClasses,
			relationships: []
		};
		
		const result = await enricher.enrich(context);
		
		// MUST NOT create virtual view nodes when real JSP files exist
		const virtualViews = result.enhancedClasses.filter(c => c.classType === 'view');
		assert.strictEqual(virtualViews.length, 0, 
			'MUST NOT create virtual view nodes when real JSP files exist');
		
		// MUST create relationships to real JSP file nodes
		const listRenders = result.newRelationships.find(r => 
		r.from === 'UserViewController.java__UserViewController' && 
		r.to === 'users/list.jsp__list.jsp' && 
		r.type === 'renders'
	);
	assert.ok(listRenders, 'MUST link controller to real list.jsp file');
	
	const viewRenders = result.newRelationships.find(r => 
		r.from === 'UserViewController.java__UserViewController' && 
		r.to === 'users/view.jsp__view.jsp' && 
		r.type === 'renders'
	);
	assert.ok(viewRenders, 'MUST link controller to real view.jsp file');
	
	const formRenders = result.newRelationships.find(r => 
		r.from === 'UserViewController.java__UserViewController' && 
		r.to === 'users/form.jsp__form.jsp' && 
		r.type === 'renders'
	);
	assert.ok(formRenders, 'MUST link controller to real form.jsp file');
	
	// MUST preserve existing JSP template nodes
	const jspNodes = result.enhancedClasses.filter(c => c.classType === 'template');
	assert.ok(jspNodes.length >= 3, 'MUST preserve JSP template nodes');
});

	test('should create virtual view when JSP file does not exist', async () => {
		// Setup: Controller that returns a view name with no matching JSP file
		const mockClasses: ClassInfo[] = [
			{
				name: 'UserViewController',
				filePath: 'UserViewController.java',
				properties: [],
				methods: [],
				classType: 'class'
			}
			// Note: No JSP files in classes array
		];
		
		const context: EnrichmentContext = {
			workspacePath: fixturesPath,
			classes: mockClasses,
			relationships: []
		};
		
		const result = await enricher.enrich(context);
		
		// MUST create virtual view nodes when JSP files don't exist
		const virtualViews = result.enhancedClasses.filter(c => c.classType === 'view');
		assert.ok(virtualViews.length > 0, 
			'MUST create virtual view nodes when JSP files do not exist');
		
		// MUST create relationships to virtual views
		const listRenders = result.newRelationships.find(r => 
			r.from === 'UserViewController' && 
			r.to === 'users/list' && 
			r.type === 'renders'
		);
		assert.ok(listRenders, 'MUST create relationship to virtual view');
	});
});
