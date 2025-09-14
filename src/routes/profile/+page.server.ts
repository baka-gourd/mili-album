import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hash, verify } from 'argon2';
import { m } from '$lib/paraglide/messages';

export const load: PageServerLoad = async ({ locals }) => {
	// 确保用户已登录
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// 返回用户信息，包括头像URL
	return {
		profile: {
			username: locals.user.name,
			avatarUrl: locals.user.avatarUrl || ''
		}
	};
};

function isHttpUrl(u: string): boolean {
	try {
		const url = new URL(u);
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

export const actions: Actions = {
	updateAvatar: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const avatarUrl = String(data.get('avatarUrl') ?? '').trim();

		if (avatarUrl && !isHttpUrl(avatarUrl)) {
			return fail(400, {
				error: m['profile.avatar.error'](),
				values: { avatarUrl }
			});
		}

		try {
			await db
				.update(user)
				.set({ avatarUrl })
				.where(eq(user.id, parseInt(locals.user.id, 10)))
				.run();

			locals.user.avatarUrl = avatarUrl;

			return { success: true };
		} catch (error) {
			console.error('更新头像失败:', error);
			return fail(500, {
				error: m['profile.avatar.error'](),
				values: { avatarUrl }
			});
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const currentPassword = String(data.get('currentPassword') ?? '');
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (newPassword.length < 6) {
			return fail(400, { passwordError: m['profile.password.error.tooShort']() });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: m['profile.password.error.mismatch']() });
		}

		try {
			const userData = await db
				.select()
				.from(user)
				.where(eq(user.id, parseInt(locals.user.id, 10)))
				.get();

			if (!userData) {
				return fail(404, { passwordError: m['profile.password.error.notFound']() });
			}

			const passwordValid = await verify(userData.password, currentPassword);
			if (!passwordValid) {
				return fail(403, { passwordError: m['profile.password.error.incorrect']() });
			}

			const newPasswordHash = await hash(newPassword);

			await db
				.update(user)
				.set({ password: newPasswordHash })
				.where(eq(user.id, parseInt(locals.user.id, 10)))
				.run();

			return { passwordSuccess: true };
		} catch (error) {
			console.error('更新密码失败:', error);
			return fail(500, { passwordError: m['profile.password.error.unknown']() });
		}
	}
};
