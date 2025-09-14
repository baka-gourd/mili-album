<script lang="ts">
	// ---- Props（Svelte 5）----
	// - 使用 $bindable 让父组件可以 bind:tags
	// - 同时提供 change 回调以兼容“回调 props”风格
	type ChangeCb = (next: string[]) => void;
	type NormalizeFn = (raw: string) => string;

	let {
		tags = $bindable<string[]>([]), // 支持 bind:tags
		placeholder = '输入后用 / 分隔…',
		allowDuplicate = false,
		maxTagLength = 80,
		maxTags = Infinity,
		disabled = false,
		separator = '/', // 默认分隔符
		normalize = ((s) => s.trim()) as NormalizeFn,
		change // 可选回调：父组件 <TagInput change={(t)=>...} />
	} = $props<{
		tags?: string[];
		placeholder?: string;
		allowDuplicate?: boolean;
		maxTagLength?: number;
		maxTags?: number;
		disabled?: boolean;
		separator?: string;
		normalize?: NormalizeFn;
		change?: ChangeCb;
	}>();

	// ---- 本地状态（Svelte 5）----
	let inputEl: HTMLInputElement;
	let draft = $state('');
	let composing = $state(false); // 处理输入法（中文等）组合阶段

	// ---- 工具函数 ----
	function emit() {
		// 支持两种用法：bind:tags 与 change 回调
		tags = [...tags];
		change?.(tags);
	}

	// 添加一批 tag（已是“最终值”，由调用处保证规范化/长度/重复逻辑）
	function pushMany(finals: string[]) {
		for (const t of finals) {
			if (tags.length >= maxTags) break;
			if (allowDuplicate || !tags.includes(t)) {
				tags.push(t);
			}
		}
		emit();
	}

	// 从 source 文本中，按分隔符切分；最后一段保留在输入框继续编辑
	function addTagsFromDraft(source: string) {
		if (!source) return;

		const sep = separator;
		const fullWidthSep = '／';
		const replaced = source.replaceAll(fullWidthSep, sep);

		const parts = replaced.split(sep);
		const remains = parts.pop() ?? '';

		const toAdd = parts
			.map((s) => normalize(s))
			.filter((s) => s.length > 0)
			.map((s) => s.slice(0, maxTagLength));

		if (toAdd.length) pushMany(toAdd);

		draft = remains;
	}

	function addSingleTagFromDraft() {
		const t = normalize(draft).slice(0, maxTagLength);
		if (t && (allowDuplicate || !tags.includes(t))) {
			if (tags.length < maxTags) {
				tags.push(t);
				emit();
			}
		}
		draft = '';
	}

	function removeAt(i: number) {
		tags.splice(i, 1);
		emit();
		inputEl?.focus();
	}

	// ---- 事件处理 ----
	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;

		// 处于 IME 组合中，避免误判 /
		if (composing) return;

		// 按下 / 让其进入 input，再在微任务中分割，获得更自然的体验
		if (e.key === '/' || e.key === '／') {
			queueMicrotask(() => addTagsFromDraft(draft));
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			addSingleTagFromDraft();
			return;
		}

		if (e.key === 'Backspace' && draft.length === 0 && tags.length > 0) {
			e.preventDefault();
			tags.pop();
			emit();
			return;
		}
	}

	function onInput(e: Event) {
		const v = (e.target as HTMLInputElement).value;
		draft = v;

		// 如果包含分隔符，进行切分（支持一次性粘贴多个）
		if (v.includes(separator) || v.includes('／')) {
			addTagsFromDraft(v);
		}
	}

	function onBlur() {
		// 失焦也提交当前草稿
		addSingleTagFromDraft();
	}

	// 处理输入法
	function onCompositionStart() {
		composing = true;
	}
	function onCompositionEnd() {
		composing = false;
		// 组合结束后若包含分隔符，做一次切分
		if (draft.includes(separator) || draft.includes('／')) {
			addTagsFromDraft(draft);
		}
	}
</script>

<!-- 外观：daisyUI 输入框 + 徽章在前 -->
<label class="form-control w-full">
	<div class="label">
		<span class="label-text">标签</span>
	</div>

	<!-- badges -->
	{#each tags as t, i}
		<span class="badge badge-primary gap-1">
			{t}
			<button
				type="button"
				class="btn btn-ghost btn-xs btn-circle"
				aria-label="删除标签"
				onclick={() => removeAt(i)}
				{disabled}
				title="删除此标签"
			>
				✕
			</button>
		</span>
	{/each}

	<!-- 输入框 -->
	<input
		bind:this={inputEl}
		class="input flex-1 min-w-[10ch] h-8 px-0 focus:outline-none"
		type="text"
		placeholder={tags.length === 0 ? placeholder : ''}
		{disabled}
		value={draft}
		onkeydown={onKeydown}
		oninput={onInput}
		onblur={onBlur}
		oncompositionstart={onCompositionStart}
		oncompositionend={onCompositionEnd}
		autocomplete="off"
		autocapitalize="off"
		spellcheck="false"
		aria-label="标签输入"
	/>

	<div class="label">
		<span class="label-text-alt">
			用「{separator}」分隔；Enter 提交；Backspace 删除最后一项
		</span>
	</div>
</label>

<style>
	/* 让 badge 的 X 按钮更紧凑一些 */
	.badge .btn-circle {
		margin-left: 4px;
	}
</style>
