<script lang="ts">
	import { enhance } from '$app/forms';
	import TagInput from '$lib/components/TagInput.svelte';
	import { m } from '$lib/paraglide/messages';
	let tags: string[] = $state(['科幻', '悬疑']);
	let loading = false;
	let toast: { type: 'success' | 'error'; text: string } | null = null;

	function isValidUrl(u: string) {
		try {
			const x = new URL(u);
			return x.protocol === 'http:' || x.protocol === 'https:';
		} catch {
			return false;
		}
	}

	function precheck(form: HTMLFormElement) {
		const fd = new FormData(form);
		const name = String(fd.get('name') ?? '').trim();
		const cover = String(fd.get('cover') ?? '').trim();

		if (!name) {
			toast = { type: 'error', text: m['create.error.nameRequired']() };
			return false;
		}
		if (cover && !isValidUrl(cover)) {
			toast = { type: 'error', text: m['create.error.coverInvalid']() };
			return false;
		}
		return true;
	}

	import { onMount } from 'svelte';
	let previewImg: HTMLImageElement | null = null;

	// 预览逻辑
	function updatePreview(url: string) {
		if (!previewImg) return;
		if (url && /^https?:\/\//.test(url)) {
			previewImg.src = url;
		} else {
			previewImg.src = '';
		}
	}

	onMount(() => {
		const formEl = document.querySelector('form');
		formEl?.addEventListener('input', (e) => {
			const target = e.target as HTMLInputElement;
			if (target.name === 'cover') {
				updatePreview(target.value.trim());
			}
		});
	});
</script>

<div class="max-w-3xl mx-auto p-6">
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body space-y-6">
			<h2 class="card-title text-2xl font-bold">{m['create.title']()}</h2>

			<form method="post" class="space-y-4">
				<!-- 基本信息分组 -->
				<fieldset class="fieldset bg-base-200 border-base-300 rounded-box p-4">
					<legend class="fieldset-legend">{m['create.title']()}</legend>

					<label class="label">
						<span class="label-text">{m['create.fields.name']()}</span>
					</label>
					<input
						type="text"
						name="name"
						placeholder={m['create.placeholder.name']()}
						class="input input-bordered w-full"
						required
					/>

					<label class="label">
						<span class="label-text">{m['create.fields.description']()}</span>
					</label>
					<textarea
						name="description"
						placeholder={m['create.placeholder.description']()}
						class="textarea textarea-bordered w-full"
						rows="4"
					></textarea>
				</fieldset>

				<!-- 附加信息分组 -->
				<fieldset class="fieldset bg-base-200 border-base-300 rounded-box p-4">
					<legend class="fieldset-legend">{m['create.fields.tags']()}</legend>
					<TagInput bind:tags placeholder="" />
					<label class="label">
						<span class="label-text">{m['create.fields.tags']()}</span>
					</label>
					<input
						type="text"
						name="tags"
						placeholder={m['create.placeholder.tags']()}
						class="input input-bordered w-full"
					/>
					<label class="label">
						<span class="label-text-alt">{m['create.hint.tags']()}</span>
					</label>
				</fieldset>

				<!-- 封面 URL + 预览信息分组 -->
				<fieldset class="fieldset bg-base-200 border-base-300 rounded-box p-4">
					<legend class="fieldset-legend">{m['create.fields.cover']()}</legend>

					<label class="label">
						<span class="label-text">{m['create.fields.cover']()}</span>
					</label>
					<input
						type="url"
						name="cover"
						placeholder={m['create.placeholder.cover']()}
						class="input input-bordered w-full"
					/>
					<label class="label">
						<span class="label-text-alt">{m['create.hint.cover']()}</span>
					</label>

					<!-- 预览 -->
					<div class="mt-4">
						<div class="label-text">{m['create.preview.title']()}</div>
						<img
							src=""
							alt="cover preview"
							class="w-full h-48 object-contain border border-base-300 rounded-box"
							bind:this={previewImg}
						/>
					</div>
				</fieldset>

				<!-- 操作按钮 -->
				<div class="flex gap-4">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{loading ? '...' : m['create.actions.submit']()}
					</button>
					<button type="reset" class="btn btn-ghost" disabled={loading}>
						{m['create.actions.reset']()}
					</button>
				</div>
			</form>

			{#if toast}
				<div class="alert {toast.type === 'success' ? 'alert-success' : 'alert-error'} mt-4">
					<span>{toast.text}</span>
				</div>
			{/if}
		</div>
	</div>
</div>
