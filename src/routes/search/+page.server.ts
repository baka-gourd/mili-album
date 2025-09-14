// src/routes/search/+page.server.ts
import type { Actions, PageServerLoad } from './$types';
import { serverSearch } from '$lib/server/meili';
import { requirePublicReadOrFail, requirePublicReadOrRedirect } from '$lib/server/auth/guard';

function escapeFacetValue(v: string) {
	// Meilisearch 过滤表达式中的简单转义
	return v.replace(/"/g, '\\"');
}

/** 把多选 facets 组合成 (A OR B) AND (C OR D) 这样的表达式 */
function buildFilterExpression(genres: string[], customTags: string[]) {
	const parts: string[] = [];

	if (genres.length) {
		const g = genres.map((val) => `genres = "${escapeFacetValue(val)}"`).join(' OR ');
		parts.push(`(${g})`);
	}
	if (customTags.length) {
		const t = customTags.map((val) => `customTags = "${escapeFacetValue(val)}"`).join(' OR ');
		parts.push(`(${t})`);
	}

	// 返回单个字符串；如果你的 serverSearch 只接受 string[]，也可传 [parts.join(' AND ')]
	return parts.length ? parts.join(' AND ') : undefined;
}

export const load: PageServerLoad = async (event) => {
	const user = requirePublicReadOrRedirect(event);

	const q = event.url.searchParams.get('q') ?? '';
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const perPage = Number(event.url.searchParams.get('perPage') ?? '12');

	// 支持 query 参数中重复 key：?genres=Pop&genres=Rock&customTags=Live
	const genres = event.url.searchParams.getAll('genres');
	const customTags = event.url.searchParams.getAll('customTags');

	// 仅当 q 为空且没有任何筛选时才返回 initial
	if (!q && genres.length === 0 && customTags.length === 0) {
		return { initial: true, result: null, user };
	}

	const filters = buildFilterExpression(genres, customTags);

	const result = await serverSearch({
		q,
		page,
		perPage,
		// 暴露这两个 facets：前端可拿到 facetsDistribution 来渲染筛选项和计数
		facets: ['genres', 'customTags'],
		// 若你的 serverSearch 接受 string[]，改成 filters ? [filters] : undefined
		filters
	});

	return { initial: false, result, user };
};

export const actions: Actions = {
	search: async (event) => {
		requirePublicReadOrFail(event);

		const fd = await event.request.formData();
		const q = String(fd.get('q') ?? '');
		const page = Number(fd.get('page') ?? '1');
		const perPage = Number(fd.get('perPage') ?? '10');

		// sort 支持多值（例如 Meili 的 "releaseDate:desc"）
		const sort = (fd.getAll('sort') as string[]) || undefined;

		// 多选筛选
		const genres = fd.getAll('genres').map(String);
		const customTags = fd.getAll('customTags').map(String);

		const filters = buildFilterExpression(genres, customTags);

		const result = await serverSearch({
			q,
			page,
			perPage,
			sort,
			facets: ['genres', 'customTags'],
			// 若 serverSearch 需要 string[]，改成 filters ? [filters] : undefined
			filters
		});

		return { ok: true, result };
	}
};
