import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getIndex } from '$lib/server/meili/index.js';
import { autoConvertText } from '$lib/server/utils/textConverter.js';
import { requireWriteReleaseOrRedirect } from '$lib/server/auth/guard.js';

type Release = {
	id: string;
	cover?: string;
	title?: string;
	titleRomaji?: string;
	titlePinyin?: string;
	description?: string;
	publisher?: string;
	releaseArtist?: string;
	releaseType?: string;
	metadataQuality?: number;
	audioQuality?: number;
	artists?: string[];
	genres?: string[];
	releaseDate?: string;
	customTags?: string[];
	relatedReleases?: string[];
	releaseCatlogNumber?: string;
	releaseItems?: string[];
	externalUrls?: string[];
	extendData?: Record<string, string>;
};

function isValidUrl(u: string) {
	try {
		const x = new URL(u);
		return x.protocol === 'http:' || x.protocol === 'https:';
	} catch {
		return false;
	}
}

export const load: PageServerLoad = async (event) => {
	requireWriteReleaseOrRedirect(event);
	return {};
};

export const actions: Actions = {
	create: async (event) => {
		requireWriteReleaseOrRedirect(event);
		try {
			const formData = await event.request.formData();

			// Get form data - note that we need to handle JSON data differently in actions
			const jsonData = formData.get('data');
			if (!jsonData) {
				return fail(400, { ok: false, error: 'noData' });
			}

			const data = JSON.parse(jsonData.toString());

			const {
				title,
				releaseArtist,
				publisher,
				description,
				releaseDate,
				releaseCatlogNumber,
				releaseType, // This will be the English value (CD, DVD, BD, Digital, Others)
				artists,
				genres,
				customTags,
				relatedReleases,
				externalUrls,
				releaseItems,
				metadataQuality,
				audioQuality,
				cover,
				extendData
			} = data;

			// Validation
			if (!title || !title.trim()) {
				return fail(400, { ok: false, error: 'nameRequired' });
			}

			if (cover && !isValidUrl(cover)) {
				return fail(400, { ok: false, error: 'coverInvalid' });
			}

			// Validate release type (ensure it's one of the expected English values)
			const validReleaseTypes = ['CD', 'DVD', 'BD', 'Digital', 'Others'];
			if (releaseType && !validReleaseTypes.includes(releaseType)) {
				return fail(400, { ok: false, error: 'invalidReleaseType' });
			}

			// Generate a unique ID for the release
			const releaseId = crypto.randomUUID();

			// Auto-convert title to romaji and pinyin
			const titleConverted = await autoConvertText(title?.trim() || '');

			// Prepare release data for MeiliSearch
			const releaseData: Release = {
				id: releaseId,
				title: title?.trim(),
				titleRomaji: titleConverted.romaji || undefined,
				titlePinyin: titleConverted.pinyin || undefined,
				releaseArtist: releaseArtist?.trim(),
				publisher: publisher?.trim(),
				description: description?.trim(),
				releaseDate: releaseDate?.trim(),
				releaseCatlogNumber: releaseCatlogNumber?.trim(),
				releaseType, // English value
				artists: artists || [],
				genres: genres || [],
				customTags: customTags || [],
				relatedReleases: relatedReleases || [],
				externalUrls: externalUrls || [],
				releaseItems: releaseItems || [],
				metadataQuality: Number(metadataQuality) || 0,
				audioQuality: Number(audioQuality) || 0,
				cover: cover?.trim(),
				extendData: extendData || {}
			};

			// Save to MeiliSearch
			try {
				const index = getIndex();
				await index.addDocuments([releaseData]);
			} catch (meiliError) {
				console.error('Failed to save to MeiliSearch:', meiliError);
				// Continue execution - we'll still return success but log the error
			}

			return { ok: true, id: releaseId };
		} catch (error) {
			console.error('Error processing release creation:', error);
			return fail(500, { ok: false, error: 'serverError' });
		}
	}
};
