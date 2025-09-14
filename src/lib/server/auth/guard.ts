import { redirect, error, type RequestEvent } from '@sveltejs/kit';

type Grant = { scope: string; verbs: Set<string> | { has: (v: string) => boolean } };
type User = { grants: Grant[] };

export function hasPublicRead(user: User | undefined | null) {
	if (!user) return false;
	return user.grants?.some((g) => g?.verbs?.has?.('read') && g.scope === 'public') ?? false;
}

export function requirePublicReadOrRedirect(event: RequestEvent) {
	const user = event.locals.user as User | undefined;
	if (!hasPublicRead(user)) throw redirect(303, '/login');
	return user!;
}

export function requirePublicReadOrFail(event: RequestEvent) {
	const user = event.locals.user as User | undefined;
	if (!hasPublicRead(user)) throw error(401, 'Unauthorized');
	return user!;
}
