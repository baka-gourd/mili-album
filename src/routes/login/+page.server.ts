import { signAccess, signRefresh } from '$lib/server/auth/jwt';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { verify } from 'argon2';
import { m } from '$lib/paraglide/messages';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/'); // 已登录直接跳转到首页
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = String(data.get('username') || '');
		const password = String(data.get('password') || '');

		const row = await db.select().from(user).where(eq(user.username, username)).get?.();

		if (!row) {
			return fail(403, { error: m['login.err.nonExist']() });
		}

		const ok = await verify(row.password, password);
		if (!ok) return fail(403, { error: m['login.err.incorrect']() });

		const access = await signAccess({ id: row.id, name: row.username });
		const refresh = await signRefresh({ id: row.id, name: row.username });

		cookies.set('access', access, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 24 * 7
		});
		cookies.set('refresh', refresh, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	}
};
