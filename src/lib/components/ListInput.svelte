<script lang="ts">
	import EditableRow from './EditableRow.svelte';
	import { m } from '$lib/paraglide/messages';

	type WebsitePrefix = { prefix: string; label: string; icon?: string };
	type LinkItem = { id: string; url: string; detectedType: string; isEditing: boolean };

	let {
		disableLink,
		items = $bindable<string[]>(),
		prefixes = [],
		onChange,
		placeholder = m['create.components.listInput.placeholder'](),
		maxLinks = 10
	}: {
		disableLink?: boolean;
		items: string[];
		prefixes?: WebsitePrefix[];
		onChange?: (links: Array<{ url: string; detectedType: string }>) => void;
		placeholder?: string;
		maxLinks?: number;
	} = $props();

	const links = $state<LinkItem[]>([]);
	let newLinkUrl = $state('');
	let isInitialized = $state(false);

	// 初始化：外部 items 变化时更新内部 links
	$effect(() => {
		if (!isInitialized && items !== undefined) {
			// 初始化时从外部 items 填充内部 links（包括空数组）
			const newLinks = items.map((url) => ({
				id: generateId(),
				url: url,
				detectedType: detectLinkType(url, prefixes),
				isEditing: false
			}));
			links.splice(0, links.length, ...newLinks);
			isInitialized = true;
		} else if (isInitialized) {
			// 已初始化后，检查外部 items 变化
			const currentUrls = links.map((l) => l.url);
			if (JSON.stringify(currentUrls) !== JSON.stringify(items)) {
				const newLinks = items.map((url) => ({
					id: generateId(),
					url: url,
					detectedType: detectLinkType(url, prefixes),
					isEditing: false
				}));
				links.splice(0, links.length, ...newLinks);
			}
		}
	});

	// 内部 links 变化时更新外部 items（但不在初始化时触发）
	$effect(() => {
		if (isInitialized) {
			items = links.map((x) => x.url);
		}
	});

	function generateId() {
		try {
			return crypto.randomUUID();
		} catch {
			return Math.random().toString(36).slice(2, 11);
		}
	}

	function detectLinkType(url: string, list: WebsitePrefix[]): string {
		if (disableLink) return '';
		const clean = url.toLowerCase().trim();
		for (const p of list) {
			if (clean.includes(p.prefix.toLowerCase()) || clean.includes(p.label.toLowerCase())) {
				return p.label;
			}
		}
		return m['create.components.listInput.defaultType']();
	}

	function normalizeUrl(url: string) {
		const u = url.trim();
		if (!u) return '';
		return u.startsWith('http://') || u.startsWith('https://') ? u : 'https://' + u;
	}

	function emitChange(ls: LinkItem[]) {
		onChange?.(ls.map((l) => ({ url: l.url, detectedType: l.detectedType })));
	}

	function addLink() {
		const raw = newLinkUrl.trim();
		if (!raw) return;
		const item: LinkItem = {
			id: generateId(),
			url: raw,
			detectedType: detectLinkType(raw, prefixes),
			isEditing: false
		};
		links.splice(0, links.length, ...[...links, item]);
		newLinkUrl = '';
		emitChange(links);
	}

	function setEditing(id: string, editing: boolean) {
		links.splice(
			0,
			links.length,
			...links.map((l) => (l.id === id ? { ...l, isEditing: editing } : l))
		);
	}

	function saveLink(id: string, newUrl: string) {
		const u = newUrl.trim();
		if (!u) return;
		links.splice(
			0,
			links.length,
			...links.map((l) =>
				l.id === id
					? { ...l, url: u, detectedType: detectLinkType(u, prefixes), isEditing: false }
					: l
			)
		);
		emitChange(links);
	}

	function deleteLink(id: string) {
		links.splice(0, links.length, ...links.filter((l) => l.id !== id));
		emitChange(links);
	}
</script>

<div class="space-y-2">
	{#each links as link (link.id)}
		{#if link.isEditing}
			<EditableRow
				link={{ url: link.url, id: link.id }}
				onSave={(d) => saveLink(d.id, d.url)}
				onCancel={() => setEditing(link.id, false)}
			/>
		{:else}
			<div class="flex">
				<div
					class="flex items-center py-2 rounded-md border bg-base-100 border-base-content/20 mr-2 flex-1"
				>
					<span class="ml-3 whitespace-nowrap">{link.detectedType}</span>

					{#if !disableLink}
						<a
							href={normalizeUrl(link.url)}
							target="_blank"
							rel="noopener noreferrer"
							class="link link-primary flex items-center flex-1 min-w-0 ml-3"
							title={link.url}
						>
							<span class="truncate">{link.url}</span>
						</a>
					{:else}
						<p>
							<span class="truncate">{link.url}</span>
						</p>
					{/if}
				</div>

				<button
					type="button"
					class="btn btn-primary"
					onclick={() => setEditing(link.id, true)}
					aria-label={m['create.components.listInput.edit']()}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4"
						><path
							d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
						/><path d="m15 5 4 4" /></svg
					>
				</button>
				<button
					type="button"
					class="ml-2 btn btn-ghost text-error"
					onclick={() => deleteLink(link.id)}
					aria-label={m['create.components.listInput.delete']()}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="w-4"
						><path d="M10 11v6" /><path d="M14 11v6" /><path
							d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
						/><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg
					>
				</button>
			</div>
		{/if}
	{/each}

	{#if links.length < maxLinks}
		<div class="flex">
			<input
				class="input input-bordered flex-1"
				{placeholder}
				bind:value={newLinkUrl}
				onkeydown={(e) => e.key === 'Enter' && addLink()}
			/>
			<button
				type="button"
				class="ml-2 btn btn-primary"
				disabled={!newLinkUrl.trim()}
				onclick={addLink}
				aria-label={m['create.components.listInput.add']()}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					class="w-4"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg
				>
			</button>
		</div>
	{/if}
</div>
