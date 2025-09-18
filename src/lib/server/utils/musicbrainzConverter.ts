/* eslint-disable @typescript-eslint/no-explicit-any */
// To parse this data:
//
//   import { Convert, MusicbrainzResponse } from "./file";
//
//   const musicbrainzResponse = Convert.toMusicbrainzResponse(json);

export interface MusicbrainzResponse {
	'packaging-id'?: null;
	'label-info'?: LabelInfo[];
	country?: string;
	barcode?: string;
	title?: string;
	'text-representation'?: TextRepresentation;
	date?: string;
	'cover-art-archive'?: CoverArtArchive;
	'release-events'?: ReleaseEvent[];
	'status-id'?: string;
	relations?: any[];
	asin?: string;
	quality?: string;
	disambiguation?: string;
	media?: Media[];
	id?: string;
	status?: string;
	packaging?: null;
}

export interface CoverArtArchive {
	count?: number;
	darkened?: boolean;
	back?: boolean;
	artwork?: boolean;
	front?: boolean;
}

export interface LabelInfo {
	'catalog-number'?: string;
	label?: Label;
}

export interface Label {
	'label-code'?: null;
	type?: null | string;
	id?: string;
	'sort-name'?: string;
	'type-id'?: null | string;
	name?: string;
	disambiguation?: string;
	country?: string;
	'iso-3166-1-codes'?: string[];
}

export interface Media {
	format?: string;
	'format-id'?: string;
	title?: string;
	id?: string;
	position?: number;
	tracks?: Track[];
	'track-count'?: number;
	'track-offset'?: number;
}

export interface Track {
	title?: string;
	id?: string;
	recording?: Recording;
	number?: string;
	position?: number;
	length?: number;
}

export interface Recording {
	title?: string;
	id?: string;
	relations?: Relation[];
	disambiguation?: string;
	video?: boolean;
	'first-release-date'?: string;
	length?: number;
}

export interface Work {
	language?: string;
	languages?: string[];
	'type-id'?: string;
	disambiguation?: string;
	attributes?: any[];
	type?: string;
	relations?: Relation[];
	id?: string;
	title?: string;
	iswcs?: string[];
}

export interface Relation {
	attributes?: any[];
	type?: string;
	'attribute-ids'?: Attribute;
	'attribute-values'?: Attribute;
	'target-credit'?: string;
	'target-type'?: string;
	'source-credit'?: string;
	begin?: null;
	ended?: boolean;
	end?: null;
	direction?: string;
	artist?: Label;
	'type-id'?: string;
	work?: Work;
	label?: Label;
}

export type Attribute = object;

export interface ReleaseEvent {
	area?: Label;
	date?: string;
}

export interface TextRepresentation {
	language?: string;
	script?: string;
}

// Converts JSON strings to/from your types
export class Convert {
	public static toMusicbrainzResponse(json: string): MusicbrainzResponse {
		return JSON.parse(json);
	}

	public static musicbrainzResponseToJson(value: MusicbrainzResponse): string {
		return JSON.stringify(value);
	}
}

// 转换MusicBrainz数据到应用格式的函数
export function convertMusicBrainzToReleaseData(mbData: MusicbrainzResponse) {
	const result: any = {
		title: mbData.title || '',
		releaseArtist: '',
		publisher: '',
		description: '',
		releaseDate: '',
		releaseCatlogNumber: '',
		releaseType: 'CD',
		artists: [] as string[],
		genres: [] as string[],
		customTags: [] as string[],
		relatedReleases: [] as string[],
		externalUrls: [] as string[],
		releaseItems: [] as string[],
		metadataQuality: 5,
		audioQuality: 60,
		cover: '',
		extendData: {} as Record<string, string>
	};

	// 提取所有艺术家到相关作者中
	const allArtists = new Set<string>();

	// 从release级别的relations中提取艺术家
	if (mbData.relations) {
		for (const relation of mbData.relations) {
			if (relation.artist?.name) {
				allArtists.add(relation.artist.name);
			}
		}
	}

	// 从媒体和录音中提取艺术家
	if (mbData.media) {
		for (const media of mbData.media) {
			if (media.tracks) {
				for (const track of media.tracks) {
					if (track.recording?.relations) {
						for (const relation of track.recording.relations) {
							if (relation.artist?.name) {
								allArtists.add(relation.artist.name);
							}
							// 从work relations中提取艺术家
							if (relation.work?.relations) {
								for (const workRelation of relation.work.relations) {
									if (workRelation.artist?.name) {
										allArtists.add(workRelation.artist.name);
									}
								}
							}
						}
					}
				}
			}
		}
	}

	result.artists = Array.from(allArtists);

	// 选择第一个有日期的release event填入到release date
	if (mbData['release-events']) {
		for (const event of mbData['release-events']) {
			if (event.date) {
				result.releaseDate = event.date;
				break;
			}
		}
	}

	// 如果有日期但没有从release events中获取到，使用顶级date
	if (!result.releaseDate && mbData.date) {
		result.releaseDate = mbData.date;
	}

	// 设置发行艺术家为第一个艺术家
	if (result.artists.length > 0) {
		result.releaseArtist = result.artists[0];
	}

	// 根据媒体格式设置releaseType
	if (mbData.media && mbData.media.length > 0) {
		const format = mbData.media[0].format?.toLowerCase();
		if (format) {
			if (format.includes('cd')) {
				result.releaseType = 'CD';
			} else if (format.includes('dvd')) {
				result.releaseType = 'DVD';
			} else if (format.includes('blu-ray') || format.includes('bd')) {
				result.releaseType = 'BD';
			} else if (format.includes('digital') || format.includes('download')) {
				result.releaseType = 'Digital';
			} else {
				result.releaseType = 'Others';
			}
		}
	}

	// 添加MusicBrainz链接到外部链接
	if (mbData.id) {
		result.externalUrls.push(`https://musicbrainz.org/release/${mbData.id}`);
	}

	// 从媒体中提取曲目信息
	if (mbData.media) {
		for (const media of mbData.media) {
			if (media.tracks) {
				for (const track of media.tracks) {
					if (track.title && track.title.trim()) {
						result.releaseItems.push(track.title.trim());
					}
				}
			}
		}
	}

	// 调试信息：记录提取的曲目数量
	// console.log(`MusicBrainz导入: 提取到 ${result.releaseItems.length} 个曲目`);
	// if (mbData.media) {
	// 	console.log(`MusicBrainz导入: 媒体数量 ${mbData.media.length}`);
	// 	mbData.media.forEach((media, index) => {
	// 		console.log(`媒体 ${index + 1}: ${media.tracks?.length || 0} 个曲目`);
	// 	});
	// }

	// 从label-info中提取catalog number，多个值用逗号分割
	if (mbData['label-info']) {
		const catalogNumbers = mbData['label-info']
			.map((labelInfo) => labelInfo['catalog-number'])
			.filter((catNum) => catNum && catNum.trim())
			.map((catNum) => catNum!.trim());

		if (catalogNumbers.length > 0) {
			result.releaseCatlogNumber = catalogNumbers.join(', ');
		}

		// 从label-info中提取publisher (label的name)，去重后用逗号分割
		const publisherNames = new Set<string>();
		mbData['label-info'].forEach((labelInfo) => {
			if (labelInfo.label?.name && labelInfo.label.name.trim()) {
				publisherNames.add(labelInfo.label.name.trim());
			}
		});

		if (publisherNames.size > 0) {
			result.publisher = Array.from(publisherNames).join(', ');
		}
	}

	// 如果没有从label-info获取到catalog number，尝试使用barcode
	if (!result.releaseCatlogNumber && mbData.barcode) {
		result.releaseCatlogNumber = mbData.barcode;
	}

	// 生成描述信息
	const descriptionParts = [];
	if (mbData.disambiguation) {
		descriptionParts.push(mbData.disambiguation);
	}
	if (mbData.packaging) {
		descriptionParts.push(`包装: ${mbData.packaging}`);
	}
	if (mbData.status) {
		descriptionParts.push(`状态: ${mbData.status}`);
	}
	if (mbData.country) {
		descriptionParts.push(`国家/地区: ${mbData.country}`);
	}
	if (mbData['text-representation']?.language) {
		descriptionParts.push(`语言: ${mbData['text-representation'].language}`);
	}
	if (descriptionParts.length > 0) {
		result.description = descriptionParts.join('\n');
	}

	// 从cover art archive获取封面信息
	if (mbData['cover-art-archive']?.front && mbData.id) {
		result.cover = `https://coverartarchive.org/release/${mbData.id}/front`;
	}

	// 将原始数据存储在extendData中
	result.extendData = {
		musicbrainz_id: mbData.id || '',
		musicbrainz_status: mbData.status || '',
		musicbrainz_country: mbData.country || '',
		musicbrainz_packaging: mbData.packaging || '',
		musicbrainz_quality: mbData.quality || '',
		musicbrainz_asin: mbData.asin || '',
		musicbrainz_barcode: mbData.barcode || '',
		musicbrainz_disambiguation: mbData.disambiguation || ''
	};

	// 如果有ASIN，添加Amazon链接
	if (mbData.asin) {
		result.externalUrls.push(`https://www.amazon.com/dp/${mbData.asin}`);
	}

	// 根据质量设置元数据质量
	if (mbData.quality) {
		const qualityMap: Record<string, number> = {
			low: 3,
			normal: 5,
			high: 8
		};
		result.metadataQuality = qualityMap[mbData.quality.toLowerCase()] || 5;
	}

	return result;
}
