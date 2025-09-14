import type { Actions, PageServerLoad } from './$types';
import { serverSearch } from '$lib/server/meili';
import { requirePublicReadOrFail, requirePublicReadOrRedirect } from '$lib/server/auth/guard';

export const load: PageServerLoad = async (event) => {
	const user = requirePublicReadOrRedirect(event);

	const q = event.url.searchParams.get('q') ?? '';
	const page = Number(event.url.searchParams.get('page') ?? '1');
	const perPage = Number(event.url.searchParams.get('perPage') ?? '12');

	if (!q) return { initial: true, result: null, user };

	const result = await serverSearch({
		q,
		page,
		perPage,
		facets: ['genres']
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

		const sort = (fd.getAll('sort') as string[]) || undefined;
		const genres = fd.getAll('genres') as string[];
		const filters = genres.length ? genres.map((g) => `genres = "${g}"`) : undefined;

		const result = await serverSearch({
			q,
			page,
			perPage,
			sort,
			facets: ['genres'],
			filters: filters && filters.length ? filters : undefined
		});

		return { ok: true, result };
	}
};
