<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

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
			facetsDistribution: {};
		};
		error?: string;
		q?: string;
		page?: number | string;
		perPage?: number | string;
	};

	type Hit = {
		id: string | number;
		title?: string;
		description?: string;
		poster?: string;
		genres?: string[];
		release_date?: string;
	};

	// 统一的搜索样式常量（顶部/底部两处共用）
	const searchRowClass = 'flex gap-3 items-center';
	const searchInputClass = 'input input-bordered flex-1 rounded-full';
	const searchBtnClass = 'btn btn-primary btn-circle btn-sm';
	const searchPlaceholder = '搜索...';

	const active = $derived<{
		query: string;
		hits: Hit[];
		total: number;
		page: number;
		perPage: number;
		totalPages: number;
	} | null>(
		(form?.result ?? data.result)
			? {
					query: (form?.result ?? data.result)?.query || '',
					hits: ((form?.result ?? data.result)?.hits ?? []) as Hit[],
					total: (form?.result ?? data.result)?.total || 0,
					page: (form?.result ?? data.result)?.page || 1,
					perPage: (form?.result ?? data.result)?.perPage || 10,
					totalPages: (form?.result ?? data.result)?.totalPages || 1
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

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});
</script>

<!-- 主内容区，去掉底部大内边距，改用页脚占位元素 -->
<div class="min-h-[calc(100vh-4rem)] bg-base-200">
	<!-- 无搜索时：显示引导和搜索框 -->
	{#if !hasQuery && !hasResults}
		<div class="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-base-content mb-4">要找什么专辑？</h1>
				<p class="text-lg text-base-content/70 mb-8">输入关键词开始搜索你想要的内容</p>

				<!-- 与底部一致的搜索行样式 -->
				<div class="w-4xl">
					<form method="POST" action="?/search" use:enhance role="search" aria-label="搜索">
						<div class={searchRowClass}>
							<input
								type="text"
								name="q"
								class={searchInputClass}
								placeholder={searchPlaceholder}
								value={q}
								autocomplete="off"
								required
							/>
							<!-- 重置分页 -->
							<input type="hidden" name="page" value="1" />
							<input type="hidden" name="perPage" value={perPage} />

							<!-- 圆形搜索按钮（与底部一致） -->
							<button class={searchBtnClass} aria-label="搜索">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									></path>
								</svg>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{:else}
		<!-- 有内容时的常规布局 -->
		<div class="container mx-auto px-4 py-6 max-w-4xl">
			{#if hasResults && active && active.totalPages > 1}
				<div class="flex justify-center mb-6">
					<div class="join">
						<form method="POST" action="?/search" use:enhance>
							<input type="hidden" name="q" value={q} />
							<input type="hidden" name="perPage" value={perPage} />
							<input type="hidden" name="page" value={Math.max(1, pageNo - 1)} />
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

			{#if hasResults && active}
				<div class="space-y-4 mb-8">
					{#each active.hits as hit (hit.id)}
						<div class="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200">
							<div class="card-body">
								<div class="flex gap-6">
									<div class="flex-shrink-0">
										{#if hit.poster}
											<div class="avatar">
												<div class="w-24 h-32 rounded-lg overflow-hidden">
													<img
														src={hit.poster}
														alt={hit.title ?? ''}
														class="w-full h-full object-cover"
														loading="lazy"
													/>
												</div>
											</div>
										{:else}
											<div class="w-24 h-32 rounded-lg skeleton"></div>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between mb-3">
											<h2 class="card-title text-xl font-semibold text-base-content">
												{hit.title}
											</h2>
											<button class="btn btn-primary btn-sm">详情</button>
										</div>

										{#if hit.genres?.length}
											<div class="flex gap-2 flex-wrap mb-3">
												{#each hit.genres as g}
													<div class="badge badge-outline badge-sm">{g}</div>
												{/each}
											</div>
										{/if}

										{#if hit.description}
											<p class="text-base-content/70 text-sm leading-relaxed line-clamp-2 mb-3">
												{hit.description}
											</p>
										{/if}

										{#if hit.release_date}
											<div class="text-xs text-base-content/60 flex items-center gap-1">
												<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
													></path>
												</svg>
												上映：{hit.release_date}
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else if hasQuery}
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
						<p class="text-base-content/60">试试其他关键词或者调整搜索条件</p>
					</div>
				</div>
			{/if}

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

			{#if hasResults && active && active.totalPages > 1}
				<div class="flex justify-center mt-8">
					<div class="join">
						<form method="POST" action="?/search" use:enhance>
							<input type="hidden" name="q" value={q} />
							<input type="hidden" name="perPage" value={perPage} />
							<input type="hidden" name="page" value={Math.max(1, pageNo - 1)} />
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
	{#if hasQuery || hasResults}
		<div class="h-32 sm:h-36"></div>
	{/if}

	<!-- 全局固定底部搜索栏（有内容时才显示），与顶部共用样式常量 -->
	{#if hasQuery || hasResults}
		<footer
			class="fixed inset-x-0 bottom-0 z-20 border-t border-base-300 bg-base-200/80 backdrop-blur"
		>
			<div class="container mx-auto max-w-4xl px-4 py-3">
				<form method="POST" action="?/search" use:enhance role="search" aria-label="搜索">
					<div class={searchRowClass}>
						<input
							type="text"
							name="q"
							class={searchInputClass}
							placeholder={searchPlaceholder}
							value={q}
							autocomplete="off"
							required
						/>
						<!-- 重置分页 -->
						<input type="hidden" name="page" value="1" />
						<input type="hidden" name="perPage" value={perPage} />

						<!-- 圆形搜索按钮 -->
						<button class={searchBtnClass} aria-label="搜索">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
						</button>
					</div>
				</form>

				{#if hasQuery}
					<div class="mt-2 text-xs sm:text-sm text-base-content/60 text-center">
						共找到 {active?.total ?? 0} 条结果
					</div>
				{/if}
			</div>
		</footer>
	{/if}
</div>

<style>
	/* 文本截断样式 */
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
		-webkit-line-clamp: 2;
	}
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
		-webkit-line-clamp: 3;
	}

	/* 平滑过渡效果 */
	.card {
		transition: all 0.2s ease-in-out;
	}
	.card:hover {
		transform: translateY(-2px);
	}
</style>
