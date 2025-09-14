import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { user, inviteCode } from '$lib/server/db/schema';
import { isAllowed } from '$lib/server/auth/roles';
import { hash } from 'argon2';
import { eq } from 'drizzle-orm';
import { m } from '$lib/paraglide/messages';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is authenticated and has admin permission
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Check for admin@ permission
	const hasAdminPermission = locals.user.grants.some(
		(grant) => grant.verbs.has('admin') && grant.scope === '*'
	);

	if (!hasAdminPermission) {
		throw redirect(303, '/');
	}

	// Fetch all users
	const users = await db.select().from(user).all();

	// Fetch all invite codes
	const codes = await db.select().from(inviteCode).all();

	return {
		users,
		codes
	};
};

export const actions: Actions = {
	deleteUser: async ({ request, locals }) => {
		// Check for admin permission
		if (!locals.user || !isAllowed(locals.user.grants, 'admin', '*')) {
			return fail(403, { error: m['admin.err.permissionDenied']() });
		}

		const data = await request.formData();
		const userId = Number(data.get('userId'));

		if (!userId || isNaN(userId)) {
			return fail(400, { error: m['admin.err.invalidUserId']() });
		}

		try {
			await db.delete(user).where(eq(user.id, userId));
			return { success: true, message: m['admin.deleteSuccess']() };
		} catch (error) {
			console.error('Error deleting user:', error);
			return fail(500, { error: m['admin.err.deleteError']() });
		}
	},

	createInviteCode: async ({ request, locals }) => {
		// Check for admin permission
		if (!locals.user || !isAllowed(locals.user.grants, 'admin', '*')) {
			return fail(403, { error: m['admin.err.permissionDenied']() });
		}

		const data = await request.formData();
		const code = String(data.get('code') || '');
		const isValid = data.get('valid') === 'true';

		if (!code.trim()) {
			// Generate a random code if none provided
			const randomCode = Math.random().toString(36).substring(2, 10);
			try {
				await db.insert(inviteCode).values({ code: randomCode, valid: isValid });
				return { success: true, message: m['admin.codeCreated']() };
			} catch (error) {
				console.error('Error creating invite code:', error);
				return fail(500, { error: m['admin.err.updateError']() });
			}
		} else {
			// Check if code already exists
			const existingCode = await db
				.select()
				.from(inviteCode)
				.where(eq(inviteCode.code, code))
				.get();
			if (existingCode) {
				return fail(400, { error: m['admin.err.codeExistsError']() });
			}

			try {
				await db.insert(inviteCode).values({ code, valid: isValid });
				return { success: true, message: m['admin.codeCreated']() };
			} catch (error) {
				console.error('Error creating invite code:', error);
				return fail(500, { error: m['admin.err.updateError']() });
			}
		}
	},

	toggleInviteCode: async ({ request, locals }) => {
		// Check for admin permission
		if (!locals.user || !isAllowed(locals.user.grants, 'admin', '*')) {
			return fail(403, { error: m['admin.err.permissionDenied']() });
		}

		const data = await request.formData();
		const codeId = Number(data.get('codeId'));

		if (!codeId || isNaN(codeId)) {
			return fail(400, { error: m['admin.err.invalidCodeId']() });
		}

		try {
			// Get current status
			const currentCode = await db.select().from(inviteCode).where(eq(inviteCode.id, codeId)).get();
			if (!currentCode) {
				return fail(404, { error: m['admin.err.invalidCodeId']() });
			}

			// Toggle status
			await db
				.update(inviteCode)
				.set({ valid: !currentCode.valid })
				.where(eq(inviteCode.id, codeId));

			return { success: true, message: m['admin.codeUpdated']() };
		} catch (error) {
			console.error('Error updating invite code:', error);
			return fail(500, { error: m['admin.err.updateError']() });
		}
	},

	deleteInviteCode: async ({ request, locals }) => {
		// Check for admin permission
		if (!locals.user || !isAllowed(locals.user.grants, 'admin', '*')) {
			return fail(403, { error: m['admin.err.permissionDenied']() });
		}

		const data = await request.formData();
		const codeId = Number(data.get('codeId'));

		if (!codeId || isNaN(codeId)) {
			return fail(400, { error: m['admin.err.invalidCodeId']() });
		}

		try {
			await db.delete(inviteCode).where(eq(inviteCode.id, codeId));
			return { success: true, message: m['admin.deleteSuccess']() };
		} catch (error) {
			console.error('Error deleting invite code:', error);
			return fail(500, { error: m['admin.err.deleteError']() });
		}
	},
	registerUser: async ({ request, locals }) => {
		// Check for admin permission
		if (!locals.user || !isAllowed(locals.user.grants, 'admin', '*')) {
			return fail(403, { error: m['admin.err.permissionDenied']() });
		}

		try {
			const data = await request.formData();

			// Prefer provided username/password, fallback to generated
			let username = data.get('username')?.toString().trim() || '';
			let plainPassword = data.get('password')?.toString() || '';

			// If custom username provided, ensure it doesn't exist
			if (username) {
				const existing = await db.select().from(user).where(eq(user.username, username)).get();
				if (existing) {
					return fail(400, { error: m['admin.err.usernameExists']() });
				}
			} else {
				username = `user_${Math.random().toString(36).substring(2, 10)}`;
			}

			if (!plainPassword) {
				plainPassword = Math.random().toString(36).substring(2, 10);
			}

			// Hash the password
			const passwordHash = await hash(plainPassword);

			// Create new user with default read permissions
			const result = await db.insert(user).values({
				username,
				password: passwordHash,
				roles: 'read@public'
			});

			// Return the credentials so admin can share them
			if (result.changes > 0) {
				return {
					success: true,
					username,
					password: plainPassword
				};
			} else {
				return fail(500, { error: m['admin.err.updateError']() });
			}
		} catch (error) {
			console.error('Error creating user:', error);
			return fail(500, { error: m['admin.err.updateError']() });
		}
	},

	updateUser: async ({ request, locals }) => {
		// Check for admin permission
		if (!locals.user || !isAllowed(locals.user.grants, 'admin', '*')) {
			return fail(403, { error: m['admin.err.permissionDenied']() });
		}

		const data = await request.formData();
		const userId = Number(data.get('userId'));
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();
		const roles = data.get('roles')?.toString();

		if (!userId || isNaN(userId)) {
			return fail(400, { error: m['admin.err.invalidUserId']() });
		}

		try {
			// Build update object
			const updateData: {
				username?: string;
				password?: string;
				roles?: string;
			} = {};

			if (username && username.trim() !== '') {
				updateData.username = username;
			}

			if (password && password.trim() !== '') {
				const passwordHash = await hash(password);
				updateData.password = passwordHash;
			}

			if (roles && roles.trim() !== '') {
				updateData.roles = roles;
			}

			// Only update if there's something to update
			if (Object.keys(updateData).length > 0) {
				await db.update(user).set(updateData).where(eq(user.id, userId));

				return { success: true };
			} else {
				return fail(400, { error: m['admin.err.noData']() });
			}
		} catch (error) {
			console.error('Error updating user:', error);
			return fail(500, { error: m['admin.err.updateError']() });
		}
	}
};
