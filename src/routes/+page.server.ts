import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// 将根路径重定向到搜索页
	throw redirect(307, '/search');
};
