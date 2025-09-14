import { env } from '$env/dynamic/private'; // 运行时读取，避免打包时固化
import {
	instantMeiliSearch,
	type InstantMeiliSearchObject
} from '@meilisearch/instant-meilisearch';

let client: InstantMeiliSearchObject | null = null;

export function getMeili() {
	if (!client) {
		client = instantMeiliSearch(env.MEILI_URL!, env.MEILI_API_KEY);
	}
	return client;
}

export function getIndex() {
	const indexName = env.MEILI_INDEX!;
	return getMeili().meiliSearchInstance.index(indexName);
}

export type SearchParams = {
	q: string;
	page?: number; // 1-based
	perPage?: number; // default 12
	filters?: string | string[]; // Meili filter 语法
	sort?: string[]; // 例如 ["release_date:desc"]
	facets?: string[]; // 例如 ["genres"]
};

export async function serverSearch<T extends Record<string, unknown> = Record<string, unknown>>({
	q,
	page = 1,
	perPage = 12,
	filters,
	sort,
	facets
}: SearchParams) {
	const index = getIndex();
	const limit = perPage;
	const offset = (page - 1) * perPage;

	const res = await index.search<T>(q, {
		limit,
		offset,
		filter: filters,
		sort,
		facets
	});

	const total = res.estimatedTotalHits ?? res.hits.length;
	const totalPages = Math.max(1, Math.ceil(total / perPage));

	return {
		query: q,
		hits: res.hits as T[],
		total,
		page,
		perPage,
		totalPages,
		facetsDistribution: (res as Record<string, unknown>).facetDistribution ?? {}
	};
}
