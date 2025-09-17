<script lang="ts">
	let {
		src,
		alt,
		class: className = '',
		...props
	}: {
		src: string;
		alt: string;
		class?: string;
		[key: string]: any;
	} = $props();

	let imageLoaded = $state(false);
	let imageError = $state(false);

	function handleLoad() {
		imageLoaded = true;
	}

	function handleError() {
		imageError = true;
		imageLoaded = true; // Hide skeleton even on error
	}
</script>

<div class="relative {className}">
	<!-- Skeleton loading state -->
	{#if !imageLoaded}
		<div class="skeleton h-full w-full absolute inset-0 rounded-lg"></div>
	{/if}

	<!-- Actual image -->
	<img
		{src}
		{alt}
		class="rounded-lg w-full h-full object-cover {imageLoaded
			? 'opacity-100'
			: 'opacity-0'} transition-opacity duration-300"
		onload={handleLoad}
		onerror={handleError}
		{...props}
	/>

	<!-- Error state fallback -->
	{#if imageError}
		<div class="absolute inset-0 bg-base-300 rounded-lg flex items-center justify-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="w-8 h-8 text-base-content/50"
			>
				<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
				<circle cx="9" cy="9" r="2" />
				<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
			</svg>
		</div>
	{/if}
</div>
