import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	// Clear authentication cookies
	cookies.delete('access', { path: '/' });
	cookies.delete('refresh', { path: '/' });

	// Redirect to home page
	throw redirect(303, '/');
};
