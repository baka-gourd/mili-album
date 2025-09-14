import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// 将用户信息传递给客户端
	return {
		user: locals.user
			? {
					id: locals.user.id,
					name: locals.user.name,
					avatarUrl: locals.user.avatarUrl,
					// 根据grants信息判断是否有管理权限，但不传递具体grant内容
					isAdmin: locals.user.grants.some((g) => g.verbs.has('admin'))
				}
			: null
	};
};
