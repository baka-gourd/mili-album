import { convertToRomaji as toRomaji, isJapanese } from 'kasaki';
import { pinyin } from 'pinyin';

// 检测是否包含日语字符
function hasJapanese(text: string): boolean {
	return isJapanese(text);
}

// 检测是否包含中文字符
function hasChinese(text: string): boolean {
	// 中文字符范围
	const chineseRegex = /[\u4e00-\u9fff]/;
	return chineseRegex.test(text);
}

export async function convertToRomaji(text: string): Promise<string> {
	if (!hasJapanese(text)) {
		return '';
	}

	try {
		const result = toRomaji(text);
		return result;
	} catch (error) {
		console.error('Error converting to romaji:', error);
		return '';
	}
}

export function convertToPinyin(text: string): string {
	if (!hasChinese(text)) {
		return '';
	}

	try {
		const result = pinyin(text, {
			style: 'normal',
			heteronym: false,
			segment: true
		});
		return result.map((item) => (Array.isArray(item) ? item[0] : item)).join(' ');
	} catch (error) {
		console.error('Error converting to pinyin:', error);
		return '';
	}
}

export async function autoConvertText(text: string): Promise<{
	romaji: string;
	pinyin: string;
}> {
	const results = {
		romaji: '',
		pinyin: ''
	};

	if (!text.trim()) {
		return results;
	}

	const [romajiResult, pinyinResult] = await Promise.all([
		convertToRomaji(text),
		Promise.resolve(convertToPinyin(text))
	]);

	results.romaji = romajiResult;
	results.pinyin = pinyinResult;

	return results;
}
