<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	export let form: any;

	let showPassword: boolean = false;

	const togglePasswordVisibility = () => {
		showPassword = !showPassword;
	};
</script>

<div class="grid place-items-center min-h-[calc(100vh-4rem)]">
	<form method="POST">
		<fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
			<legend class="fieldset-legend text-2xl">{m['register.title']()}</legend>

			<label class="label" for="username">{m['register.username']()}</label>
			<input type="text" id="username" name="username" class="input" autocomplete="username" />

			<label class="label" for="password">{m['register.password']()}</label>
			<div class="relative">
				<input
					type={showPassword ? 'text' : 'password'}
					id="password"
					name="password"
					class="input pr-12 w-full"
					autocomplete="new-password"
				/>
				<button
					type="button"
					class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
					on:click={togglePasswordVisibility}
					aria-label={showPassword ? 'Hide password' : 'Show password'}
				>
					{#if showPassword}
						<!-- 隐藏图标 (眼睛关闭) -->
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
							class="lucide lucide-eye-off-icon lucide-eye-off"
							><path
								d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
							/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path
								d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
							/><path d="m2 2 20 20" /></svg
						>
					{:else}
						<!-- 显示图标 (眼睛打开) -->
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
							class="lucide lucide-eye-icon lucide-eye"
							><path
								d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
							/><circle cx="12" cy="12" r="3" /></svg
						>
					{/if}
				</button>
			</div>

			<label class="label" for="code">{m['register.inviteCode']()}</label>
			<input type="text" id="code" name="code" class="input" />

			<button type="submit" class="btn btn-primary mt-4">{m['register.action']()}</button>
		</fieldset>
		{#if form?.error}
			<div role="alert" class="mt-3 alert alert-error">
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
			</div>
		{/if}
	</form>
</div>
