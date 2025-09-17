<script lang="ts">
	type ChangeCb = (next: string[]) => void;
	type NormalizeFn = (raw: string) => string;

	let {
		tags = $bindable<string[]>([]),
		placeholder = '',
		hint = '',
		allowDuplicate = false,
		maxTagLength = 80,
		maxTags = Infinity,
		disabled = false,
		separators = ['\\\\', ';'],
		normalize = ((s) => s.trim()) as NormalizeFn,
		change
	} = $props<{
		tags?: string[];
		hint?: string;
		placeholder?: string;
		allowDuplicate?: boolean;
		maxTagLength?: number;
		maxTags?: number;
		disabled?: boolean;
		separator?: string;
		normalize?: NormalizeFn;
		change?: ChangeCb;
	}>();

	let text = $state('');
	let internal_tags = $state<string[]>([]);

	let initialized = $state(false);
	$effect(() => {
		if (!initialized && tags && tags.length > 0) {
			internal_tags = [...tags];
			initialized = true;
		}
	});

	$effect(() => {
		if (change) {
			change([...internal_tags]);
		}
		text = internal_tags.join(';');
		if (initialized) {
			tags = [...internal_tags];
		}
	});

	function addTag(tagValue: string) {
		processInput();
	}

	function processInput() {
		if (!text) {
			internal_tags = [];
			return;
		}

		let separator = ';';
		for (const sep of separators) {
			if (text.indexOf(sep) !== -1) {
				separator = sep;
				break;
			}
		}

		const newTags: string[] = text
			.split(separator)
			.filter((t) => t.trim().length > 0)
			.map(normalize);

		let filteredTags: string[];

		if (!allowDuplicate) {
			filteredTags = [...new Set(newTags)]
				.filter((tag) => tag.length <= maxTagLength)
				.slice(0, maxTags);
		} else {
			filteredTags = newTags.filter((tag) => tag.length <= maxTagLength).slice(0, maxTags);
		}

		internal_tags = filteredTags;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			processInput();
		}
	}
</script>

<fieldset class="fieldset">
	{#if hint}
		<legend class="fieldset-legend">{hint}</legend>
	{/if}
	<input
		type="text"
		class="input w-full"
		bind:value={text}
		{disabled}
		{placeholder}
		onkeydown={handleKeydown}
		onblur={processInput}
	/>

	<div class="flex align-baseline w-full flex-wrap">
		{#each internal_tags as t}
			<div class="badge badge-soft badge-neutral mx-0.5 my-0.5">
				<span class="text-base-content">{t}</span>
			</div>
		{/each}
	</div>
</fieldset>
