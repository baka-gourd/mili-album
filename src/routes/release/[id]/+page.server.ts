import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getIndex } from '$lib/server/meili/index.js';
import { requirePublicReadOrRedirect } from '$lib/server/auth/guard.js';

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

export const load: PageServerLoad = async (event) => {
	requirePublicReadOrRedirect(event);

	const { id } = event.params;

	if (!id) {
		throw error(400, 'Release ID is required');
	}

	try {
		const index = getIndex();
		const result = await index.getDocument(id);

		if (!result) {
			throw error(404, 'Release not found');
		}

		return {
			release: result as Release
		};
	} catch (meiliError: unknown) {
		console.error('Failed to fetch release from MeiliSearch:', meiliError);

		// Check if it's a 404 from MeiliSearch
		if (
			typeof meiliError === 'object' &&
			meiliError !== null &&
			('code' in meiliError || 'httpStatus' in meiliError)
		) {
			const err = meiliError as { code?: string; httpStatus?: number };
			if (err.code === 'document_not_found' || err.httpStatus === 404) {
				throw error(404, 'Release not found');
			}
		}

		throw error(500, 'Failed to load release data');
	}
};
