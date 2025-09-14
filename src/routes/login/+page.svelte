<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	export let form: any;
</script>

<div class="grid place-items-center min-h-[calc(100vh-4rem)]">
	<form method="POST">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
			<legend class="fieldset-legend text-2xl">{m['login.title']()}</legend>

			<label class="label" for="username">{m['login.username']()}</label>
			<input type="text" id="username" name="username" class="input" autocomplete="username" />

			<label class="label" for="password">{m['login.password']()}</label>
			<input
				type="password"
				id="password"
				name="password"
				class="input"
				autocomplete="current-password"
			/>

			<button type="submit" class="btn btn-primary mt-4">{m['login.action']()}</button>
		</fieldset>
		{#if form?.error}<div role="alert" class="mt-3 alert alert-error">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-circle-alert-icon lucide-circle-alert"
					><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line
						x1="12"
						x2="12.01"
						y1="16"
						y2="16"
					/></svg
				>
				<span>{form.error}</span>
			</div>{/if}
	</form>
</div>

<style>
	input[type='password']::-ms-reveal,
	input[type='password']::-ms-clear {
		display: none !important;
	}
</style>
