<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	
	type LinkItem = { id: string; url: string };

	let {
		link,
		onSave,
		onCancel
	}: {
		link: LinkItem;
		onSave?: (detail: { id: string; url: string }) => void;
		onCancel?: (detail: { id: string }) => void;
	} = $props();

	let editUrl = $state(link.url);

	$effect(() => {
		editUrl = link.url;
	});

	function save() {
		const u = editUrl.trim();
		if (!u) return;
		onSave?.({ id: link.id, url: u });
	}

	function cancel() {
		editUrl = link.url;
		onCancel?.({ id: link.id });
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter') save();
		else if (e.key === 'Escape') cancel();
	}

	function autofocus(node: HTMLElement) {
		queueMicrotask(() => (node as HTMLInputElement).focus?.());
		return {};
	}
</script>

<div class="flex gap-2">
	<input class="input flex-1" bind:value={editUrl} onkeydown={onKey} use:autofocus />
	<button type="button" class="btn btn-primary" disabled={!editUrl.trim()} onclick={save}>
		{m['create.actions.save']()}
	</button>
	<button type="button" class="btn btn-outline border-base-content/20" onclick={cancel}>
		{m['create.actions.cancel']()}
	</button>
</div>
