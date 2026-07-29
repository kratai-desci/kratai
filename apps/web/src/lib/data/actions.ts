'use server';

import type { KrataiConfig } from '@kratai/core';
import { revalidatePath } from 'next/cache';

import * as mockViews from './mock/views';
import type { CreateViewInput, WebDiagramView } from './types';

/**
 * Mutations, called from Client Components. Same swap seam as
 * lib/data/index.ts: phase 2 replaces mockViews' in-memory store with real
 * MongoDB Atlas persistence behind these same signatures.
 */

export async function createViewAction(input: CreateViewInput): Promise<WebDiagramView> {
	const view = mockViews.createView(input);
	revalidatePath('/dashboard');
	return view;
}

export async function updateViewAction(
	id: string,
	updates: { name?: string; config?: KrataiConfig }
): Promise<WebDiagramView | undefined> {
	const view = mockViews.updateView(id, updates);
	revalidatePath('/dashboard');
	revalidatePath(`/diagrams/${id}`);
	return view;
}

export async function deleteViewAction(id: string): Promise<void> {
	mockViews.deleteView(id);
	revalidatePath('/dashboard');
}
