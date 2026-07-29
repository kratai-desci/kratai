'use server';

import type { CreateViewInput, WebDiagramView } from '@/2_domain';
import { viewRepository } from '@/3_infrastructure/viewRepository';
import type { KrataiConfig } from '@kratai/core';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from './queries';

/**
 * Mutation use cases, called from Client Components. Same dependency
 * shape as queries.ts: depends only on the domain-typed viewRepository
 * instance, not on a concrete implementation. The owning user is always
 * resolved server-side from the signed-in session here, never accepted
 * from the caller - a Client Component has no way to claim a view on
 * someone else's behalf.
 */

export async function createViewAction(input: CreateViewInput): Promise<WebDiagramView> {
	const user = await getCurrentUser();
	const view = await viewRepository.createView(user.id, input);
	revalidatePath('/dashboard');
	return view;
}

export async function updateViewAction(
	id: string,
	updates: { name?: string; config?: KrataiConfig }
): Promise<WebDiagramView | undefined> {
	const user = await getCurrentUser();
	const view = await viewRepository.updateView(id, user.id, updates);
	revalidatePath('/dashboard');
	revalidatePath(`/diagrams/${id}`);
	return view;
}

export async function deleteViewAction(id: string): Promise<void> {
	const user = await getCurrentUser();
	await viewRepository.deleteView(id, user.id);
	revalidatePath('/dashboard');
}
