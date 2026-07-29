'use server';

import type { CreateViewInput, WebDiagramView } from '@/2_domain';
import { viewRepository } from '@/3_infrastructure/viewRepository';
import type { KrataiConfig } from '@kratai/core';
import { revalidatePath } from 'next/cache';

/**
 * Mutation use cases, called from Client Components. Same dependency
 * shape as queries.ts: depends only on the domain-typed viewRepository
 * instance, not on a concrete implementation.
 */

export async function createViewAction(input: CreateViewInput): Promise<WebDiagramView> {
	const view = await viewRepository.createView(input);
	revalidatePath('/dashboard');
	return view;
}

export async function updateViewAction(
	id: string,
	updates: { name?: string; config?: KrataiConfig }
): Promise<WebDiagramView | undefined> {
	const view = await viewRepository.updateView(id, updates);
	revalidatePath('/dashboard');
	revalidatePath(`/diagrams/${id}`);
	return view;
}

export async function deleteViewAction(id: string): Promise<void> {
	await viewRepository.deleteView(id);
	revalidatePath('/dashboard');
}
