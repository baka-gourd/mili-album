import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { RENEW_THRESHOLD_SEC, signAccess, signRefresh, verify } from '$lib/server/auth/jwt';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { parseRoles } from '$lib/server/auth/roles';
import { sequence } from '@sveltejs/kit/hooks';
import { eq } from 'drizzle-orm';

const handleAuth: Handle = async ({ event, resolve }) => {
	const access = event.cookies.get('access');
	const refresh = event.cookies.get('refresh');

	let claims: null | { id: string; name: string; roles: string[]; exp?: number } = null;
	let needRenew = false;

	if (access) {
		try {
			const { payload } = await verify(access);
			claims = {
				id: String(payload.id),
				name: String(payload.name),
				roles: (payload.roles as string[]) ?? []
			};
			const now = Math.floor(Date.now() / 1000);
			if (payload.exp && payload.exp - now < RENEW_THRESHOLD_SEC) needRenew = true;
		} catch {
			/* ignore */
		}
	}

	if (!claims && refresh) {
		try {
			const { payload } = await verify(refresh);
			claims = {
				id: String(payload.id),
				name: String(payload.name),
				roles: []
			};
			needRenew = true;
		} catch {
			/* ignore */
		}
	}

	if (claims) {
		const row = await db
			.select()
			.from(user)
			.where(eq(user.id, Number(claims.id)))
			.get?.();
		const roleStr = row?.roles ?? claims.roles?.join('/') ?? '';
		const grants = parseRoles(roleStr);
		const avatar = row?.avatarUrl ?? undefined;
		event.locals.user = {
			id: claims.id,
			name: claims.name,
			grants,
			avatarUrl: avatar
		};

		if (needRenew) {
			const newAccess = await signAccess({
				id: Number(claims.id),
				name: claims.name
			});
			const newRefresh = await signRefresh({
				id: Number(claims.id),
				name: claims.name
			});

			event.cookies.set('access', newAccess, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: 60 * 30
			});
			event.cookies.set('refresh', newRefresh, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: 60 * 60 * 24 * 7
			});
		}
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

export const handle: Handle = sequence(handleParaglide, handleAuth);
