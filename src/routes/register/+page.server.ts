import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { hash } from 'argon2';
import { and, eq } from 'drizzle-orm';
import { inviteCode } from '../../lib/server/db/schema';
import { m } from '$lib/paraglide/messages';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const username = String(data.get('username') || '');
		const password = String(data.get('password') || '');
		const code = String(data.get('code') || '');

		const codeValid = await db
			.select()
			.from(inviteCode)
			.where(and(eq(inviteCode.valid, true), eq(inviteCode.code, code)))
			.get?.();

		if (!codeValid) {
			return fail(403, { error: m['register.err.code']() });
		}

		const exist = await db.select().from(user).where(eq(user.username, username)).get?.();
		if (exist) {
			return fail(403, { error: '已存在同名用户' });
		}

		const passwordHash = await hash(password);
		const result = await db.insert(user).values({ username: username, password: passwordHash });

		if (result.changes > 0) {
			throw redirect(303, '/login');
		}

		throw fail(500, { error: '未知的内部错误' });
	}
};
