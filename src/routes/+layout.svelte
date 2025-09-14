<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Header appName="Meili Album" user={data.user} />

<main class="pt-16">
	{@render children?.()}
</main>
