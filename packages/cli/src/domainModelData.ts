export interface DomainAttribute {
	name: string;
	type: string;
	isPK?: boolean;
	isFK?: boolean;
}

export interface DomainEntity {
	id: string;
	name: string;
	attributes: DomainAttribute[];
}

export interface DomainRelationship {
	fromId: string;
	toId: string;
	kind: 'one-to-one' | 'one-to-many' | 'many-to-many';
	label?: string;
}

export interface DomainModelData {
	workspaceName: string;
	entities: DomainEntity[];
	relationships: DomainRelationship[];
}

/**
 * Hand-written preview fixture - mirrors buildMockUseCaseDiagramData's role
 * exactly (useCaseDiagramData.ts). Real extraction (deriving entities from
 * @kratai/analysis's ClassInfo.entityMeta/repositoryMeta ORM-detection
 * metadata, already collected but unused for this) is a later phase - this
 * only exists so the Domain Model view has something to render.
 */
export function buildMockDomainModelData(workspaceName: string): DomainModelData {
	return {
		workspaceName,
		entities: [
			{
				id: 'user',
				name: 'User',
				attributes: [
					{ name: 'id', type: 'uuid', isPK: true },
					{ name: 'email', type: 'string' },
					{ name: 'passwordHash', type: 'string' },
					{ name: 'createdAt', type: 'datetime' }
				]
			},
			{
				id: 'order',
				name: 'Order',
				attributes: [
					{ name: 'id', type: 'uuid', isPK: true },
					{ name: 'userId', type: 'uuid', isFK: true },
					{ name: 'status', type: 'string' },
					{ name: 'totalCents', type: 'integer' },
					{ name: 'placedAt', type: 'datetime' }
				]
			},
			{
				id: 'orderItem',
				name: 'OrderItem',
				attributes: [
					{ name: 'id', type: 'uuid', isPK: true },
					{ name: 'orderId', type: 'uuid', isFK: true },
					{ name: 'productId', type: 'uuid', isFK: true },
					{ name: 'quantity', type: 'integer' }
				]
			},
			{
				id: 'product',
				name: 'Product',
				attributes: [
					{ name: 'id', type: 'uuid', isPK: true },
					{ name: 'name', type: 'string' },
					{ name: 'priceCents', type: 'integer' }
				]
			}
		],
		relationships: [
			{ fromId: 'user', toId: 'order', kind: 'one-to-many', label: 'places' },
			{ fromId: 'order', toId: 'orderItem', kind: 'one-to-many', label: 'contains' },
			{ fromId: 'product', toId: 'orderItem', kind: 'one-to-many', label: 'ordered as' }
		]
	};
}
