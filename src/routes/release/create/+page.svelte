<script lang="ts">
	import ListInput from '$lib/components/ListInput.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import { m } from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';

	const knownSites: { prefix: string; label: string; icon?: string }[] = [
		{ prefix: 'https://musicbrainz.org', label: 'Musicbrainz' },
		{ prefix: 'https://vgmdb.net', label: 'VGMdb' },
		{ prefix: 'https://www.discogs.com', label: 'Discogs' }
	];

	// Define English original values for medium types
	const mediumTypes = {
		CD: 'CD',
		DVD: 'DVD',
		BD: 'BD',
		Digital: 'Digital',
		Others: 'Others'
	};

	let genres: string[] = $state([]);
	let customTags: string[] = $state([]);
	let relatedReleases: string[] = $state([]);
	let artists: string[] = $state([]);
	let releaseItems: string[] = $state([]);
	let externalUrls: string[] = $state([]);
	let releaseArtist: string = $state('');
	let title: string = $state('');
	let publisher: string = $state('');
	let description: string = $state('');
	let metaQuality = $state(1);
	let audioQuality = $state(60);
	let releaseCatlogNumber: string = $state('');
	let releaseType: string = $state('CD'); // Store English value
	let releaseDate: string = $state('');
	let extendJson = $state('');
	let loading = $state(false);
	let cover = $state('');
	let toast: { type: 'success' | 'error'; text: string } | null = $state(null);

	function isValidUrl(u: string) {
		try {
			const x = new URL(u);
			return x.protocol === 'http:' || x.protocol === 'https:';
		} catch {
			return false;
		}
	}

	function validateForm() {
		if (!title.trim()) {
			toast = { type: 'error', text: m['create.error.nameRequired']() };
			return false;
		}
		if (cover && !isValidUrl(cover)) {
			toast = { type: 'error', text: m['create.error.coverInvalid']() };
			return false;
		}
		return true;
	}

	async function submitRelease() {
		if (!validateForm()) return;

		loading = true;
		toast = null;

		try {
			// Parse extendJson to extendData object
			let extendData: Record<string, string> = {};
			if (extendJson.trim()) {
				try {
					const parsed = JSON.parse(extendJson.trim());
					// Convert all values to strings as required by the backend type
					extendData = Object.fromEntries(
						Object.entries(parsed).map(([key, value]) => [key, String(value)])
					);
				} catch (e) {
					toast = { type: 'error', text: 'Invalid JSON format in extended data' };
					loading = false;
					return;
				}
			}

			const releaseData = {
				title: title.trim(),
				releaseArtist: releaseArtist.trim(),
				publisher: publisher.trim(),
				description: description.trim(),
				releaseDate: releaseDate.trim(),
				releaseCatlogNumber: releaseCatlogNumber.trim(),
				releaseType: releaseType, // English value
				artists,
				genres,
				customTags,
				relatedReleases,
				externalUrls,
				releaseItems,
				metadataQuality: metaQuality,
				audioQuality,
				cover: cover.trim(),
				extendData
			};

			// Use SvelteKit actions
			const formData = new FormData();
			formData.append('data', JSON.stringify(releaseData));

			const response = await fetch('?/create', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result.type === 'success' || result.ok) {
				toast = { type: 'success', text: m['create.toast.success']() };
				// Optionally redirect or reset form
				const data = JSON.parse(result.data);
				const idIndex = data[0].id;
				if (idIndex) {
					setTimeout(() => {
						goto(`/release/${data[idIndex]}`);
					}, 2000);
				} else {
					setTimeout(() => {
						goto('/');
					}, 2000);
				}
			} else {
				const errorMsg = result.data?.error || result.error || m['create.toast.error']();
				toast = { type: 'error', text: errorMsg };
			}
		} catch (error) {
			console.error('Submit error:', error);
			toast = { type: 'error', text: m['create.toast.error']() };
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		title = '';
		releaseArtist = '';
		publisher = '';
		description = '';
		releaseDate = '';
		releaseCatlogNumber = '';
		releaseType = 'CD';
		cover = '';
		extendJson = '';
		genres = [];
		customTags = [];
		relatedReleases = [];
		artists = [];
		releaseItems = [];
		externalUrls = [];
		metaQuality = 1;
		audioQuality = 60;
		toast = null;
		updatePreview('');
	}

	let previewUrl: string = $state('');
	function updatePreview(url: string) {
		if (url && /^https?:\/\//.test(url)) {
			previewUrl = url;
		} else {
			previewUrl = '';
		}
	}

	// Watch cover changes for preview
	$effect(() => {
		updatePreview(cover);
	});

	// MusicBrainz导入功能
	let musicbrainzUrl: string = $state('');
	let importing = $state(false);

	async function importFromMusicBrainz() {
		if (!musicbrainzUrl.trim()) {
			toast = { type: 'error', text: '请输入MusicBrainz链接' };
			return;
		}

		importing = true;
		toast = null;

		try {
			const response = await fetch('/api/musicbrainz', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ url: musicbrainzUrl.trim() })
			});

			const result = await response.json();

			if (result.success && result.data) {
				// 填充表单数据
				const data = result.data;
				title = data.title || '';
				releaseArtist = data.releaseArtist || '';
				publisher = data.publisher || '';
				description = data.description || '';
				releaseDate = data.releaseDate || '';
				releaseCatlogNumber = data.releaseCatlogNumber || '';
				releaseType = data.releaseType || 'CD';
				artists = data.artists || [];
				genres = data.genres || [];
				customTags = data.customTags || [];
				relatedReleases = data.relatedReleases || [];
				externalUrls = data.externalUrls || [];
				releaseItems = data.releaseItems || [];
				metaQuality = data.metadataQuality || 5;
				audioQuality = data.audioQuality || 60;
				cover = data.cover || '';
				extendJson = data.extendData ? JSON.stringify(data.extendData, null, 2) : '';

				toast = { type: 'success', text: '成功从MusicBrainz导入数据！' };
				musicbrainzUrl = ''; // 清空输入框
			} else {
				toast = { type: 'error', text: result.error || '导入失败' };
			}
		} catch (error) {
			console.error('导入错误:', error);
			toast = { type: 'error', text: '导入过程中发生错误' };
		} finally {
			importing = false;
		}
	}
</script>

<div class="mx-auto p-6 md:columns-2">
	<div class="space-y-4">
		<!-- MusicBrainz导入分组 -->
		<fieldset class="fieldset bg-primary/10 border-primary/30 rounded-box p-4">
			<legend class="fieldset-legend text-xl text-primary">从MusicBrainz导入</legend>
			<div class="space-y-3">
				<div class="text-sm text-base-content/70">
					输入MusicBrainz发行版本链接，例如：https://musicbrainz.org/release/f4abd0e4-8e6e-41f7-b9d1-e4e1e5be2496
				</div>
				<div class="join w-full">
					<input
						type="url"
						placeholder="https://musicbrainz.org/release/..."
						class="input input-bordered join-item flex-1"
						bind:value={musicbrainzUrl}
						disabled={importing}
					/>
					<button
						type="button"
						class="btn btn-primary join-item"
						disabled={importing || !musicbrainzUrl.trim()}
						onclick={importFromMusicBrainz}
					>
						{#if importing}
							<span class="loading loading-spinner loading-sm"></span>
							导入中...
						{:else}
							<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
								></path>
							</svg>
							导入
						{/if}
					</button>
				</div>
			</div>
		</fieldset>

		<!-- 基本信息分组 -->
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box p-4">
			<legend class="fieldset-legend text-2xl">{m['create.title']()}</legend>
			<label class="input join-item w-full">
				<span class="label">{m['create.fields.releaseName']()}</span>
				<input
					type="text"
					placeholder={m['create.placeholder.name']()}
					required
					bind:value={title}
				/>
			</label>
			<div class="join">
				<label class="input join-item w-full">
					<span class="label">{m['create.fields.releaseArtist']()}</span>
					<input
						type="text"
						placeholder={m['create.placeholder.name']()}
						bind:value={releaseArtist}
					/>
				</label>
				<label class="input join-item w-full">
					<span class="label">{m['create.fields.publisher']()}</span>
					<input type="text" placeholder={m['create.placeholder.name']()} bind:value={publisher} />
				</label>
			</div>
			<div class="join">
				<label class="input join-item w-full">
					<span class="label">{m['create.fields.releaseDate']()}</span>
					<input
						type="text"
						placeholder={m['create.placeholder.releaseDate']()}
						bind:value={releaseDate}
					/>
				</label>
				<label class="input join-item w-full">
					<span class="label">{m['create.fields.catalogNumber']()}</span>
					<input type="text" bind:value={releaseCatlogNumber} />
				</label>
				<select class="select join-item w-full" bind:value={releaseType}>
					<option disabled value="">{m['create.options.medium.default']()}</option>
					<option value="CD">{m['create.options.medium.cd']()}</option>
					<option value="DVD">{m['create.options.medium.dvd']()}</option>
					<option value="BD">{m['create.options.medium.bd']()}</option>
					<option value="Digital">{m['create.options.medium.digital']()}</option>
					<option value="Others">{m['create.options.medium.others']()}</option>
				</select>
			</div>
			<TagInput bind:tags={artists} placeholder="" hint={m['create.hint.artists']()} />
			<legend class="fieldset-legend">{m['create.fields.releaseDescription']()}</legend>
			<textarea
				placeholder={m['create.placeholder.description']()}
				class="textarea textarea-bordered w-full"
				rows="4"
				bind:value={description}
			></textarea>
		</fieldset>

		<!-- 附加信息分组 -->
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box p-4 md:break-after-column">
			<legend class="fieldset-legend text-2xl">{m['create.fields.tags']()}</legend>
			<TagInput bind:tags={genres} placeholder="" hint={m['create.fields.genres']()} />
			<TagInput bind:tags={customTags} placeholder="" hint={m['create.fields.customTags']()} />
			<legend class="fieldset-legend">{m['create.fields.relatedWebsites']()}</legend>
			<ListInput prefixes={knownSites} bind:items={externalUrls}></ListInput>
		</fieldset>

		<!-- 额外信息分组 -->
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box p-4">
			<legend class="fieldset-legend text-2xl">{m['create.fields.moreInfo']()}</legend>
			<legend class="fieldset-legend">{m['create.fields.relatedReleases']()}</legend>
			<ListInput bind:items={relatedReleases}></ListInput>
			<legend class="fieldset-legend">{m['create.fields.metaQuality']()}</legend>
			<div class="tooltip tooltip-primary">
				<div class="tooltip-content">{metaQuality}</div>
				<input
					type="range"
					min="0"
					max="10"
					bind:value={metaQuality}
					class="range w-full range-primary"
				/>
			</div>
			<legend class="fieldset-legend">{m['create.fields.audioQuality']()}</legend>
			<div class="tooltip tooltip-primary">
				<div class="tooltip-content">{audioQuality}</div>
				<input
					type="range"
					min="0"
					max="100"
					bind:value={audioQuality}
					class="range w-full range-primary"
				/>
			</div>
			<div class="collapse bg-base-100 border-base-300 border">
				<input type="checkbox" />
				<div class="collapse-title font-semibold text-lg">{m['create.fields.releaseAudio']()}</div>
				<div class="collapse-content">
					<ListInput bind:items={releaseItems} disableLink></ListInput>
				</div>
			</div>
			<div class="collapse bg-base-100 border-base-300 border">
				<input type="checkbox" />
				<div class="collapse-title font-semibold text-lg">{m['create.fields.advancedInfo']()}</div>
				<div class="collapse-content">
					<textarea
						name="description"
						placeholder={m['create.placeholder.json']()}
						class="textarea textarea-bordered w-full"
						rows="4"
						bind:value={extendJson}
					></textarea>
				</div>
			</div>
		</fieldset>

		<!-- 封面 URL + 预览信息分组 -->
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box p-4">
			<legend class="fieldset-legend text-2xl">{m['create.fields.cover']()}</legend>

			<input
				type="url"
				name="cover"
				placeholder={m['create.placeholder.cover']()}
				class="input input-bordered w-full"
				bind:value={cover}
			/>

			<!-- 预览 -->
			<div class="mt-4">
				<div class="label-text">{m['create.preview.title']()}</div>
				{#if previewUrl}
					<img
						src={previewUrl}
						alt="cover preview"
						class="w-48 h-48 object-contain border border-base-300 rounded-box"
					/>
				{:else}
					<div class="w-48 h-48 border border-base-300 rounded-box placeholder-bg"></div>
				{/if}
			</div>
		</fieldset>

		<!-- 操作按钮 -->
		<div class="flex gap-4">
			<button type="button" class="btn btn-primary" disabled={loading} onclick={submitRelease}>
				{#if loading}
					<span class="loading loading-spinner"></span>
					loading
				{:else}
					{m['create.actions.submit']()}
				{/if}
			</button>
			<button type="button" class="btn btn-ghost" disabled={loading} onclick={resetForm}>
				{m['create.actions.reset']()}
			</button>
		</div>
	</div>

	{#if toast}
		<div class="alert {toast.type === 'success' ? 'alert-success' : 'alert-error'} mt-4">
			<span>{toast.text}</span>
		</div>
	{/if}
</div>

<style>
	.placeholder-bg {
		background-color: #f0f0f0;
		background-image:
			linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
			linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
			linear-gradient(-45deg, transparent 75%, #e0e0e0 75%);
		background-size: 20px 20px;
		background-position:
			0 0,
			0 10px,
			10px -10px,
			-10px 0px;
	}
</style>
