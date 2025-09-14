import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

function isValidUrl(u: string) {
	try {
		const x = new URL(u);
		return x.protocol === 'http:' || x.protocol === 'https:';
	} catch {
		return false;
	}
}

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const fd = await request.formData();
		const name = String(fd.get('name') ?? '').trim();
		const description = String(fd.get('description') ?? '').trim();
		const tags = String(fd.get('tags') ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const cover = String(fd.get('cover') ?? '').trim();

		if (!name) {
			// 失败时返回一个可被前端识别的错误码
			return fail(400, { ok: false, error: 'nameRequired' });
		}
		if (cover && !isValidUrl(cover)) {
			return fail(400, { ok: false, error: 'coverInvalid' });
		}

		// TODO: 写入数据库
		// await db.insert(...)

		return { ok: true };
	}
};
