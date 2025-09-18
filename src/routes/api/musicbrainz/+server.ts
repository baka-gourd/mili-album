import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
	convertMusicBrainzToReleaseData,
	Convert
} from '$lib/server/utils/musicbrainzConverter.js';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { url } = await request.json();

		if (!url) {
			return json({ error: '请提供MusicBrainz链接' }, { status: 400 });
		}

		// 从URL中提取UUID
		const uuidMatch = url.match(/\/release\/([a-f0-9-]{36})/i);
		if (!uuidMatch) {
			return json({ error: '无效的MusicBrainz链接格式' }, { status: 400 });
		}

		const uuid = uuidMatch[1];

		// 构建API请求URL
		const apiUrl = `https://musicbrainz.org/ws/2/release/${uuid}?fmt=json&inc=recordings%2Brecording-level-rels%2Bwork-rels%2Bwork-level-rels%2Bartist-rels%2Blabel-rels%2Blabels`;

		// 请求MusicBrainz API
		const response = await fetch(apiUrl, {
			headers: {
				'User-Agent': 'MeiliAlbum/1.0.0',
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				return json({ error: '未找到指定的发行版本' }, { status: 404 });
			}
			return json(
				{ error: `MusicBrainz API请求失败: ${response.status}` },
				{ status: response.status }
			);
		}

		const mbData = await response.text();

		// 解析MusicBrainz数据
		let parsedData;
		try {
			parsedData = Convert.toMusicbrainzResponse(mbData);
		} catch (parseError) {
			console.error('MusicBrainz数据解析失败:', parseError);
			return json({ error: 'MusicBrainz数据解析失败' }, { status: 500 });
		}

		// 转换为应用格式
		const releaseData = convertMusicBrainzToReleaseData(parsedData);

		return json({ success: true, data: releaseData });
	} catch (error) {
		console.error('MusicBrainz导入错误:', error);
		return json({ error: '服务器内部错误' }, { status: 500 });
	}
};
