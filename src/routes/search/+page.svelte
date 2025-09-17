<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data, form } = $props();

	type SearchForm = {
		ok?: boolean;
		result?: {
			query: string;
			hits: Record<string, unknown>[];
			total: number;
			page: number;
			perPage: number;
			totalPages: number;
			facetsDistribution: Record<string, Record<string, number>>;
		};
		error?: string;
		q?: string;
		page?: number | string;
		perPage?: number | string;
	};

	type Hit = {
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

	// 搜索状态
	let isSearching = $state(false);
	let searchQuery = $state('');

	// 筛选状态
	let selectedGenres = $state<string[]>([]);
	let selectedCustomTags = $state<string[]>([]);
	let selectedReleaseTypes = $state<string[]>([]);

	// 统一的搜索样式常量
	const searchRowClass = 'flex gap-3 items-center';
	const searchInputClass = 'input input-bordered flex-1 rounded-full';
	const searchBtnClass = 'btn btn-primary btn-circle btn-sm';
	const searchPlaceholder = '搜索专辑、艺术家、类型...';

	const active = $derived<{
		query: string;
		hits: Hit[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
		facetsDistribution?: Record<string, Record<string, number>>;
	} | null>(
		(form?.result ?? data.result)
			? {
					query: (form?.result ?? data.result)?.query || '',
					hits: ((form?.result ?? data.result)?.hits ?? []) as Hit[],
					total: (form?.result ?? data.result)?.total || 0,
					page: (form?.result ?? data.result)?.page || 1,
					perPage: (form?.result ?? data.result)?.perPage || 12,
					totalPages: (form?.result ?? data.result)?.totalPages || 1,
					facetsDistribution:
						(form?.result ?? data.result)?.facetsDistribution &&
						Object.keys((form?.result ?? data.result)?.facetsDistribution || {}).length > 0
							? ((form?.result ?? data.result)?.facetsDistribution as Record<
									string,
									Record<string, number>
								>)
							: undefined
				}
			: null
	);

	const q = $derived<string>(
		(form as SearchForm)?.q ?? (form as SearchForm)?.result?.query ?? active?.query ?? ''
	);
	const pageNo = $derived<number>(
		Number((form as SearchForm)?.page ?? (form as SearchForm)?.result?.page ?? active?.page ?? 1)
	);
	const perPage = $derived<number>(
		Number(
			(form as SearchForm)?.perPage ??
				(form as SearchForm)?.result?.perPage ??
				active?.perPage ??
				12
		)
	);

	const hasResults = $derived<boolean>(Boolean(active && active.hits?.length));
	const hasQuery = $derived<boolean>(Boolean(q && q.trim()));
	const hasFilters = $derived<boolean>(
		selectedGenres.length > 0 || selectedCustomTags.length > 0 || selectedReleaseTypes.length > 0
	);

	// 获取可用的筛选选项
	const availableGenres = $derived<string[]>(
		active?.facetsDistribution?.genres ? Object.keys(active.facetsDistribution.genres) : []
	);
	const availableCustomTags = $derived<string[]>(
		active?.facetsDistribution?.customTags ? Object.keys(active.facetsDistribution.customTags) : []
	);
	const availableReleaseTypes = $derived<string[]>(
		active?.facetsDistribution?.releaseType
			? Object.keys(active.facetsDistribution.releaseType)
			: []
	);

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
		// 初始化搜索查询
		searchQuery = q;
		// 从URL参数初始化筛选器
		initializeFiltersFromUrl();
	});

	// 从URL参数初始化筛选器
	function initializeFiltersFromUrl() {
		const urlParams = page.url.searchParams;
		selectedGenres = urlParams.getAll('genres');
		selectedCustomTags = urlParams.getAll('customTags');
		selectedReleaseTypes = urlParams.getAll('releaseTypes');
	}

	// 同步URL参数
	function updateUrlParams(params: Record<string, string | string[]>) {
		const url = new URL(page.url);

		// 清除现有的搜索相关参数
		url.searchParams.delete('q');
		url.searchParams.delete('page');
		url.searchParams.delete('perPage');
		url.searchParams.delete('genres');
		url.searchParams.delete('customTags');
		url.searchParams.delete('releaseTypes');

		// 添加新参数
		Object.entries(params).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				value.forEach((v) => url.searchParams.append(key, v));
			} else if (value) {
				url.searchParams.set(key, value);
			}
		});

		// 更新URL但不重新加载页面
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	// 格式化日期
	function formatDate(dateString?: string) {
		if (!dateString) return '未知日期';
		try {
			return new Date(dateString).toLocaleDateString('zh-CN');
		} catch {
			return dateString;
		}
	}

	// 获取质量徽章颜色
	function getQualityBadgeColor(quality?: number) {
		if (!quality) return 'badge-ghost';
		if (quality >= 8) return 'badge-success';
		if (quality >= 6) return 'badge-warning';
		return 'badge-error';
	}

	// 格式化质量文本
	function formatQuality(quality?: number, unit = 10) {
		if (!quality) return '未知';
		return `${quality}/${unit}`;
	}

	// 处理搜索表单提交
	function handleSearchSubmit() {
		isSearching = true;
		// enhance 会自动处理表单提交，这里只需要设置loading状态
	}

	// 处理搜索完成
	function handleSearchComplete(result: any) {
		isSearching = false;
		// 搜索完成后同步URL参数
		if (result?.type === 'success' && result?.data?.result) {
			const params: Record<string, string | string[]> = {
				q: result.data.result.query || '',
				page: String(result.data.result.page || 1),
				perPage: String(result.data.result.perPage || 12)
			};

			// 添加筛选参数
			if (selectedGenres.length > 0) params.genres = selectedGenres;
			if (selectedCustomTags.length > 0) params.customTags = selectedCustomTags;
			if (selectedReleaseTypes.length > 0) params.releaseTypes = selectedReleaseTypes;

			updateUrlParams(params);
		}
	}

	// 跳转到编辑页面
	function editRelease(releaseId: string) {
		goto(`/release/edit/${releaseId}`);
	}

	// 跳转到详情页面
	function viewRelease(releaseId: string) {
		goto(`/release/${releaseId}`);
	}
</script>

<!-- 主内容区 -->
<div class="min-h-[calc(100vh-4rem)] bg-base-200">
	<!-- 无搜索时：显示引导和搜索框 -->
	{#if !hasQuery && !hasResults && !hasFilters}
		<div class="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-base-content mb-4">发现你的音乐收藏</h1>
				<p class="text-lg text-base-content/70 mb-8">
					搜索专辑、艺术家或使用筛选器找到你想要的内容
				</p>

				<!-- 搜索框 -->
				<div class="w-4xl">
					<form
						method="POST"
						action="?/search"
						use:enhance={({ formElement, formData, action, cancel, submitter }) => {
							handleSearchSubmit();
							return async ({ result, update }) => {
								handleSearchComplete(result);
								await update();
							};
						}}
						role="search"
						aria-label="搜索"
					>
						<div class={searchRowClass}>
							<input
								type="text"
								name="q"
								class={searchInputClass}
								placeholder={searchPlaceholder}
								bind:value={searchQuery}
								autocomplete="off"
								required
							/>
							<!-- 重置分页 -->
							<input type="hidden" name="page" value="1" />
							<input type="hidden" name="perPage" value={perPage} />

							<!-- 搜索按钮带loading动画 -->
							<button class={searchBtnClass} aria-label="搜索" disabled={isSearching}>
								{#if isSearching}
									<span class="loading loading-spinner loading-sm"></span>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										></path>
									</svg>
								{/if}
							</button>
						</div>
					</form>
				</div>

				<!-- 快速筛选提示 -->
				<div class="mt-8 text-sm text-base-content/60">
					<p>💡 提示：搜索后可使用筛选器按类型、标签等条件精确查找</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- 有内容时的常规布局 -->
		<div class="container mx-auto px-4 py-6 max-w-6xl">
			<!-- 筛选器区域 -->
			{#if hasQuery || hasResults}
				<div class="bg-base-100 rounded-lg shadow-sm border border-base-300 p-4 mb-6">
					<div class="flex flex-wrap gap-4">
						<!-- 类型筛选 -->
						{#if availableGenres.length > 0}
							<div class="flex-1 min-w-48">
								<legend class="fieldset-legend">
									<span class="label-text font-medium">音乐类型</span>
								</legend>
								<div class="flex flex-wrap gap-2">
									{#each availableGenres.slice(0, 8) as genre}
										<label class="cursor-pointer">
											<input
												type="checkbox"
												class="checkbox checkbox-sm checkbox-primary"
												bind:group={selectedGenres}
												value={genre}
											/>
											<span class="ml-2 text-sm">{genre}</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Release Type筛选 -->
						{#if availableReleaseTypes.length > 0}
							<div class="flex-1 min-w-48">
								<legend class="fieldset-legend">
									<span class="label-text font-medium">发行类型</span>
								</legend>
								<div class="flex flex-wrap gap-2">
									{#each availableReleaseTypes as releaseType}
										<label class="cursor-pointer">
											<input
												type="checkbox"
												class="checkbox checkbox-sm checkbox-secondary"
												bind:group={selectedReleaseTypes}
												value={releaseType}
											/>
											<span class="ml-2 text-sm">{releaseType}</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}

						<!-- 自定义标签筛选 -->
						{#if availableCustomTags.length > 0}
							<div class="flex-1 min-w-48">
								<legend class="fieldset-legend">
									<span class="label-text font-medium">自定义标签</span>
								</legend>
								<div class="flex flex-wrap gap-2">
									{#each availableCustomTags.slice(0, 6) as tag}
										<label class="cursor-pointer">
											<input
												type="checkbox"
												class="checkbox checkbox-sm checkbox-accent"
												bind:group={selectedCustomTags}
												value={tag}
											/>
											<span class="ml-2 text-sm">{tag}</span>
										</label>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- 应用筛选按钮 -->
					{#if hasFilters}
						<div class="mt-4 flex gap-2">
							<form method="POST" action="?/search" use:enhance>
								<input type="hidden" name="q" value={q} />
								<input type="hidden" name="page" value="1" />
								<input type="hidden" name="perPage" value={perPage} />
								{#each selectedGenres as genre}
									<input type="hidden" name="genres" value={genre} />
								{/each}
								{#each selectedCustomTags as tag}
									<input type="hidden" name="customTags" value={tag} />
								{/each}
								{#each selectedReleaseTypes as releaseType}
									<input type="hidden" name="releaseTypes" value={releaseType} />
								{/each}
								<button class="btn btn-primary btn-sm">应用筛选</button>
							</form>
							<button
								class="btn btn-ghost btn-sm"
								onclick={() => {
									selectedGenres = [];
									selectedCustomTags = [];
									selectedReleaseTypes = [];
								}}
							>
								清除筛选
							</button>
						</div>
					{/if}
				</div>
			{/if}

			<!-- 分页导航（顶部） -->
			{#if hasResults && active && active.totalPages > 1}
				<div class="flex justify-center mb-6">
					<div class="join">
						<form method="POST" action="?/search" use:enhance>
							<input type="hidden" name="q" value={q} />
							<input type="hidden" name="perPage" value={perPage} />
							<input type="hidden" name="page" value={Math.max(1, pageNo - 1)} />
							{#each selectedGenres as genre}
								<input type="hidden" name="genres" value={genre} />
							{/each}
							{#each selectedCustomTags as tag}
								<input type="hidden" name="customTags" value={tag} />
							{/each}
							{#each selectedReleaseTypes as releaseType}
								<input type="hidden" name="releaseTypes" value={releaseType} />
							{/each}
							<button class="join-item btn" disabled={pageNo <= 1}>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									></path>
								</svg>
								上一页
							</button>
						</form>

						<button class="join-item btn btn-active no-animation" disabled>
							{pageNo} / {active.totalPages}
						</button>

						<form method="POST" action="?/search" use:enhance>
							<input type="hidden" name="q" value={q} />
							<input type="hidden" name="perPage" value={perPage} />
							<input type="hidden" name="page" value={Math.min(active.totalPages, pageNo + 1)} />
							{#each selectedGenres as genre}
								<input type="hidden" name="genres" value={genre} />
							{/each}
							{#each selectedCustomTags as tag}
								<input type="hidden" name="customTags" value={tag} />
							{/each}
							{#each selectedReleaseTypes as releaseType}
								<input type="hidden" name="releaseTypes" value={releaseType} />
							{/each}
							<button class="join-item btn" disabled={pageNo >= active.totalPages}>
								下一页
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									></path>
								</svg>
							</button>
						</form>
					</div>
				</div>
			{/if}

			<!-- 搜索结果 -->
			{#if hasResults && active}
				<div class="space-y-4 mb-8">
					{#each active.hits as hit (hit.id)}
						<div class="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200">
							<div class="card-body">
								<div class="flex gap-6">
									<!-- 专辑信息 -->
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between mb-3">
											<div class="flex-1">
												<h2 class="card-title text-xl font-semibold text-base-content mb-2">
													{hit.title}
												</h2>
												{#if hit.releaseArtist}
													<p class="text-primary font-medium mb-2">{hit.releaseArtist}</p>
												{/if}
											</div>
											<div class="flex gap-2">
												<button class="btn btn-outline btn-sm" onclick={() => editRelease(hit.id)}>
													编辑
												</button>
												<button class="btn btn-primary btn-sm" onclick={() => viewRelease(hit.id)}>
													详情
												</button>
											</div>
										</div>

										<!-- 发行类型和质量信息 -->
										<div class="flex gap-2 flex-wrap mb-3">
											{#if hit.releaseType}
												<div class="badge badge-secondary badge-sm">{hit.releaseType}</div>
											{/if}
											{#if hit.metadataQuality}
												<div
													class="badge badge-outline {getQualityBadgeColor(
														hit.metadataQuality
													)} badge-sm"
												>
													元数据: {formatQuality(hit.metadataQuality)}
												</div>
											{/if}
											{#if hit.audioQuality}
												<div
													class="badge badge-outline {getQualityBadgeColor(
														hit.audioQuality / 10
													)} badge-sm"
												>
													音频: {formatQuality(hit.audioQuality, 100)}
												</div>
											{/if}
										</div>

										<!-- 类型标签 -->
										{#if hit.genres?.length}
											<div class="flex gap-2 flex-wrap mb-3">
												{#each hit.genres as genre}
													<div class="badge badge-primary badge-sm">{genre}</div>
												{/each}
											</div>
										{/if}

										<!-- 描述 -->
										{#if hit.description}
											<p class="text-base-content/70 text-sm leading-relaxed line-clamp-2 mb-3">
												{hit.description}
											</p>
										{/if}

										<!-- 发行日期 -->
										{#if hit.releaseDate}
											<div class="text-xs text-base-content/60 flex items-center gap-1">
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
													></path>
												</svg>
												发行：{formatDate(hit.releaseDate)}
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if hasQuery || hasFilters}
				<div class="flex flex-col items-center justify-center py-16">
					<div class="text-center">
						<div
							class="w-16 h-16 mx-auto mb-4 rounded-full bg-base-300 flex items-center justify-center"
						>
							<svg
								class="w-8 h-8 text-base-content/40"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
						</div>
						<h3 class="text-lg font-medium text-base-content mb-2">没有找到相关结果</h3>
						<p class="text-base-content/60">试试其他关键词或者调整筛选条件</p>
					</div>
				</div>
			{/if}

			<!-- 错误信息 -->
			{#if (form as SearchForm)?.error}
				<div class="alert alert-error mb-4">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span>{(form as SearchForm).error}</span>
				</div>
			{/if}

			<!-- 分页导航（底部） -->
			{#if hasResults && active && active.totalPages > 1}
				<div class="flex justify-center mt-8">
					<div class="join">
						<form method="POST" action="?/search" use:enhance>
							<input type="hidden" name="q" value={q} />
							<input type="hidden" name="perPage" value={perPage} />
							<input type="hidden" name="page" value={Math.max(1, pageNo - 1)} />
							{#each selectedGenres as genre}
								<input type="hidden" name="genres" value={genre} />
							{/each}
							{#each selectedCustomTags as tag}
								<input type="hidden" name="customTags" value={tag} />
							{/each}
							{#each selectedReleaseTypes as releaseType}
								<input type="hidden" name="releaseTypes" value={releaseType} />
							{/each}
							<button class="join-item btn" disabled={pageNo <= 1}>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									></path>
								</svg>
								上一页
							</button>
						</form>

						<button class="join-item btn btn-active no-animation" disabled>
							{pageNo} / {active.totalPages}
						</button>

						<form method="POST" action="?/search" use:enhance>
							<input type="hidden" name="q" value={q} />
							<input type="hidden" name="perPage" value={perPage} />
							<input type="hidden" name="page" value={Math.min(active.totalPages, pageNo + 1)} />
							{#each selectedGenres as genre}
								<input type="hidden" name="genres" value={genre} />
							{/each}
							{#each selectedCustomTags as tag}
								<input type="hidden" name="customTags" value={tag} />
							{/each}
							{#each selectedReleaseTypes as releaseType}
								<input type="hidden" name="releaseTypes" value={releaseType} />
							{/each}
							<button class="join-item btn" disabled={pageNo >= active.totalPages}>
								下一页
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									></path>
								</svg>
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- 添加底部占位空间，避免内容被固定底栏遮挡 -->
	{#if hasQuery || hasResults || hasFilters}
		<div class="h-32 sm:h-36"></div>
	{/if}

	<!-- 全局固定底部搜索栏（有内容时才显示） -->
	{#if hasQuery || hasResults || hasFilters}
		<footer
			class="fixed inset-x-0 bottom-0 z-20 border-t border-base-300 bg-base-200/80 backdrop-blur"
		>
			<div class="container mx-auto max-w-4xl px-4 py-3">
				<form
					method="POST"
					action="?/search"
					use:enhance={({ formElement, formData, action, cancel, submitter }) => {
						handleSearchSubmit();
						return async ({ result, update }) => {
							handleSearchComplete(result);
							await update();
						};
					}}
					role="search"
					aria-label="搜索"
				>
					<div class={searchRowClass}>
						<input
							type="text"
							name="q"
							class={searchInputClass}
							placeholder={searchPlaceholder}
							bind:value={searchQuery}
							autocomplete="off"
							required
						/>
						<!-- 重置分页 -->
						<input type="hidden" name="page" value="1" />
						<input type="hidden" name="perPage" value={perPage} />
						<!-- 保持当前筛选 -->
						{#each selectedGenres as genre}
							<input type="hidden" name="genres" value={genre} />
						{/each}
						{#each selectedCustomTags as tag}
							<input type="hidden" name="customTags" value={tag} />
						{/each}
						{#each selectedReleaseTypes as releaseType}
							<input type="hidden" name="releaseTypes" value={releaseType} />
						{/each}

						<!-- 搜索按钮带loading动画 -->
						<button class={searchBtnClass} aria-label="搜索" disabled={isSearching}>
							{#if isSearching}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									></path>
								</svg>
							{/if}
						</button>
					</div>
				</form>

				{#if hasQuery}
					<div class="mt-2 text-xs sm:text-sm text-base-content/60 text-center">
						共找到 {active?.total ?? 0} 条结果
						{#if hasFilters}
							<span class="ml-2">（已应用筛选）</span>
						{/if}
					</div>
				{/if}
			</div>
		</footer>
	{/if}
</div>