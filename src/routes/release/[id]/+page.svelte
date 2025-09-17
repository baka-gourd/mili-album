<script lang="ts">
	import type { PageData } from './$types';
	import ImageSkeleton from '$lib/components/ImageSkeleton.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();
	const { release } = data;

	// Helper function to format date
	function formatDate(dateString?: string) {
		if (!dateString) return m['release.detail.unknownDate']();
		try {
			return new Date(dateString).toLocaleDateString('zh-CN');
		} catch {
			return dateString;
		}
	}

	// Helper function to get quality badge color
	function getQualityBadgeColor(quality?: number) {
		if (!quality) return 'badge-ghost';
		if (quality >= 8) return 'badge-success';
		if (quality >= 6) return 'badge-warning';
		return 'badge-error';
	}

	// Helper function to format quality text
	function formatQuality(quality?: number, unit?: number) {
		if (!quality) return m['release.detail.unknownQuality']();
		return `${quality}/${unit}`;
	}
</script>

<svelte:head>
	<title
		>{release.title || m['release.detail.unknownAlbum']()} - {m['release.detail.title']()}</title
	>
	<meta name="description" content={release.description || 'Release details'} />
</svelte:head>

<div class="min-h-screen bg-base-100">
	<div class="max-w-6xl mx-auto px-4 py-8">
		<!-- Header Section with Album Cover and Title -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
			<!-- Album Cover -->
			<div class="md:col-span-1">
				{#if release.cover}
					<div class="md:w-full md:aspect-square bg-base-300 rounded-lg shadow-lg overflow-hidden">
						<ImageSkeleton
							src={release.cover}
							alt={release.title || m['release.detail.albumCover']()}
							class="w-full h-full object-cover"
							referrerpolicy="no-referrer"
							loading="lazy"
							decoding="async"
						></ImageSkeleton>
					</div>
				{:else}
					<div
						class="md:w-full md:aspect-square bg-base-300 rounded-lg shadow-lg flex items-center justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="w-full h-full p-8 opacity-60"
							aria-hidden="true"
						>
							<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
							<circle cx="9" cy="9" r="2" />
							<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
						</svg>
					</div>
				{/if}
			</div>

			<!-- Title and Basic Info -->
			<div class="md:col-span-2 space-y-4">
				<div class="space-y-2">
					<h1 class="text-4xl font-bold text-balance">
						{release.title || m['release.detail.unknownAlbum']()}
					</h1>

					<!-- Quality Badges -->
					{#if release.metadataQuality || release.audioQuality}
						<div class="flex gap-2">
							{#if release.metadataQuality}
								<div
									class="badge badge-outline {getQualityBadgeColor(release.metadataQuality)} gap-1"
								>
									<svg
										class="w-4"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										><ellipse cx="12" cy="5" rx="9" ry="3" /><path
											d="M3 5V19A9 3 0 0 0 21 19V5"
										/><path d="M3 12A9 3 0 0 0 21 12" /></svg
									>
									{formatQuality(release.metadataQuality, 10)}
								</div>
							{/if}

							{#if release.audioQuality}
								<div
									class="badge badge-outline {getQualityBadgeColor(
										release.audioQuality / 10
									)} gap-1"
								>
									<svg class="w-4" fill="currentColor" viewBox="0 0 20 20">
										<path
											d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
										/>
									</svg>
									{formatQuality(release.audioQuality, 100)}
								</div>
							{/if}
						</div>
					{/if}

					{#if release.releaseArtist}
						<p class="text-2xl text-primary font-medium">{release.releaseArtist}</p>
					{/if}
				</div>

				<!-- Description in header area -->
				{#if release.description}
					<div class="bg-base-200/50 rounded-lg p-4">
						<p class="text-pretty leading-relaxed text-base-content/80">{release.description}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Release Information Card -->
		<div class="card bg-base-100 shadow-lg mb-6 border border-base-300">
			<div class="card-header">
				<div class="card-title text-lg flex items-center gap-2 p-6 pb-0">
					{m['release.detail.releaseInfo']()}
				</div>
			</div>
			<div class="card-body space-y-4">
				{#if release.releaseDate}
					<div class="flex items-center gap-3">
						<svg class="w-4 h-4 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-sm text-base-content/60">{m['release.detail.releaseDate']()}:</span>
						<span>{formatDate(release.releaseDate)}</span>
					</div>
				{/if}

				{#if release.publisher}
					<div class="flex items-center gap-3">
						<svg class="w-4 h-4 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-sm text-base-content/60">{m['release.detail.publisher']()}:</span>
						<span>{release.publisher}</span>
					</div>
				{/if}

				{#if release.releaseType}
					<div class="flex items-center gap-3">
						<svg class="w-4 h-4 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
							/>
						</svg>
						<span class="text-sm text-base-content/60">{m['release.detail.releaseType']()}:</span>
						<span class="badge badge-outline">{release.releaseType}</span>
					</div>
				{/if}

				{#if release.releaseCatlogNumber}
					<div class="flex items-center gap-3">
						<svg class="w-4 h-4 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<span class="text-sm text-base-content/60">{m['release.detail.catalogNumber']()}:</span>
						<span class="font-mono text-sm">{release.releaseCatlogNumber}</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Artists Card -->
		{#if release.artists && release.artists.length > 0}
			<div class="card bg-base-100 shadow-lg mb-6 border border-base-300">
				<div class="card-header">
					<div class="card-title text-lg flex items-center gap-2 p-6 pb-0">
						{m['release.detail.participatingArtists']()}
					</div>
				</div>
				<div class="card-body">
					<div class="flex flex-wrap gap-2">
						{#each release.artists as artist}
							<span class="badge badge-secondary">{artist}</span>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Genres and Tags Card -->
		{#if (release.genres && release.genres.length > 0) || (release.customTags && release.customTags.length > 0)}
			<div class="card bg-base-100 shadow-lg mb-6 border border-base-300">
				<div class="card-header">
					<div class="card-title text-lg flex items-center gap-2 p-6 pb-0">
						{m['release.detail.categoryTags']()}
					</div>
				</div>
				<div class="card-body space-y-4">
					{#if release.genres && release.genres.length > 0}
						<div>
							<h4 class="text-sm font-medium text-base-content/60 mb-2">
								{m['release.detail.musicGenres']()}
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each release.genres as genre}
									<span class="badge badge-primary">{genre}</span>
								{/each}
							</div>
						</div>
					{/if}

					{#if release.customTags && release.customTags.length > 0}
						<div>
							<h4 class="text-sm font-medium text-base-content/60 mb-2">
								{m['release.detail.customTags']()}
							</h4>
							<div class="flex flex-wrap gap-2">
								{#each release.customTags as tag}
									<span class="badge badge-outline">{tag}</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Release Items Card -->
		{#if release.releaseItems && release.releaseItems.length > 0}
			<div class="card bg-base-100 shadow-lg mb-6 border border-base-300">
				<div class="card-header">
					<div class="card-title text-lg flex items-center gap-2 p-6 pb-0">
						{m['release.detail.releaseContent']()}
					</div>
				</div>
				<div class="card-body">
					<ul class="space-y-2">
						{#each release.releaseItems as item}
							<li class="flex items-start gap-2">
								<span class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
								<span class="text-base-content/80">{item}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}

		<!-- External Links Card -->
		{#if release.externalUrls && release.externalUrls.length > 0}
			<div class="card bg-base-100 shadow-lg mb-6 border border-base-300">
				<div class="card-header">
					<div class="card-title text-lg flex items-center gap-2 p-6 pb-0">
						{m['release.detail.externalLinks']()}
					</div>
				</div>
				<div class="card-body">
					<div class="space-y-2">
						{#each release.externalUrls as url}
							<a
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								class="btn btn-outline w-full justify-start bg-transparent"
							>
								{new URL(url).hostname}
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Related Releases Card -->
		{#if release.relatedReleases && release.relatedReleases.length > 0}
			<div class="card bg-base-100 shadow-lg mb-6 border border-base-300">
				<div class="card-header">
					<div class="card-title text-lg flex items-center gap-2 p-6 pb-0">
						{m['release.detail.relatedReleases']()}
					</div>
				</div>
				<div class="card-body">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each release.relatedReleases as relatedId}
							<a href="/release/{relatedId}" class="btn btn-outline">
								Release {relatedId}
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Extended Data Card -->
		{#if release.extendData && Object.keys(release.extendData).length > 0}
			<div class="card bg-base-100 shadow-lg mb-6 border border-base-300">
				<div class="card-header">
					<div class="card-title text-lg flex items-center gap-2 p-6 pb-0">
						{m['release.detail.extendedInfo']()}
					</div>
				</div>
				<div class="card-body">
					<div class="space-y-3">
						{#each Object.entries(release.extendData) as [key, value]}
							<div class="flex justify-between items-start">
								<span class="text-sm text-base-content/60 font-medium">{key}:</span>
								<span class="text-sm text-right max-w-xs">{value}</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex justify-center gap-4 mt-8">
			<a href="/release/edit/{release.id}" class="btn btn-primary">
				{m['release.detail.editRelease']()}
			</a>
			<button class="btn btn-outline" onclick={() => history.back()}>
				{m['release.detail.goBack']()}
			</button>
		</div>
	</div>
</div>
