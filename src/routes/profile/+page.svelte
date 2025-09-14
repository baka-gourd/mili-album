<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages';

	let { data, form } = $props();

	const profile = $derived(data.profile);

	let avatarUrl = $state(profile.avatarUrl || '');
	let isPreviewVisible = $derived(!!avatarUrl);

	function handlePreview() {
		isPreviewVisible = !!avatarUrl;
	}

	function resetAvatarUrl() {
		avatarUrl = '';
		isPreviewVisible = !!avatarUrl;
	}
</script>

<div class="container mx-auto px-4 py-8 max-w-3xl">
	<div>
		<div class="py-6">
			<h1 class="card-title text-2xl mb-6">{m['profile.title']()}</h1>

			<div class="grid grid-cols-1 gap-8">
				<!-- 头像预览卡 -->
				<div class="flex flex-col items-center justify-start">
					<div class="avatar mb-4">
						<div
							class="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
						>
							{#if isPreviewVisible && avatarUrl}
								<img src={avatarUrl} alt={m['profile.avatar.alt']()} />
							{:else}
								<div class="w-full h-full grid place-items-center bg-base-300">
									<span class="text-4xl font-bold">
										{profile.username?.[0]?.toUpperCase() ?? 'U'}
									</span>
								</div>
							{/if}
						</div>
					</div>

					<h2 class="text-xl font-semibold mb-1">{profile.username}</h2>

					{#if isPreviewVisible && avatarUrl !== profile.avatarUrl}
						<div class="badge badge-primary mt-2">{m['profile.avatar.preview']()}</div>
					{/if}
				</div>

				<!-- 更新头像表单 -->
				<div>
					<form method="POST" action="?/updateAvatar" use:enhance class="space-y-6">
						{#if form?.error}
							<div class="alert alert-error">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span>{form.error || m['profile.avatar.error']()}</span>
							</div>
						{/if}

						<div class="form-control w-full">
							<label class="label" for="avatarUrl">
								{m['profile.avatar.title']()}
							</label>
							<div class="flex gap-2">
								<input
									type="url"
									id="avatarUrl"
									name="avatarUrl"
									bind:value={avatarUrl}
									class="input input-bordered w-full"
									placeholder={m['profile.avatar.placeholder']()}
									aria-label={m['profile.avatar.inputLabel']()}
								/>
								<button
									type="button"
									class="btn btn-square btn-outline"
									title={m['profile.avatar.preview']()}
									aria-label={m['profile.avatar.previewAria']()}
									onclick={handlePreview}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="lucide lucide-eye"
									>
										<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								</button>
							</div>
							<label class="label" for="avatarUrl">
								{m['profile.avatar.hint']()}
							</label>
						</div>

						<div class="flex justify-end gap-2 mt-6">
							<button type="button" class="btn btn-outline" onclick={resetAvatarUrl}>
								{m['profile.avatar.reset']()}
							</button>
							<button type="submit" class="btn btn-primary">
								{m['profile.avatar.save']()}
							</button>
						</div>

						{#if form?.success}
							<div class="mt-4 alert alert-success">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span>{m['profile.avatar.success']()}</span>
							</div>
						{/if}
					</form>
				</div>

				<!-- 修改密码表单 -->
				<div class="pt-8">
					<h3 class="text-xl font-semibold mb-6">{m['profile.password.title']()}</h3>
					<form method="POST" action="?/changePassword" use:enhance class="space-y-6">
						{#if form?.passwordError}
							<div class="alert alert-error">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 0 0118 0z"
									/>
								</svg>
								<span>{form.passwordError || m['profile.password.error.unknown']()}</span>
							</div>
						{/if}

						<div class="form-control w-full">
							<label class="label" for="currentPassword">{m['profile.password.current']()}</label>
							<input
								type="password"
								id="currentPassword"
								name="currentPassword"
								class="input input-bordered w-full"
								required
								autocomplete="current-password"
								aria-label={m['profile.password.current']()}
							/>
						</div>

						<div class="form-control w-full">
							<label class="label" for="newPassword">{m['profile.password.new']()}</label>
							<input
								type="password"
								id="newPassword"
								name="newPassword"
								class="input input-bordered w-full"
								required
								minlength="6"
								autocomplete="new-password"
								aria-label={m['profile.password.new']()}
							/>
							<label class="label" for="newPassword">
								<span class="label-text-alt">{m['profile.password.hint']()}</span>
							</label>
						</div>

						<div class="form-control w-full">
							<label class="label" for="confirmPassword">{m['profile.password.confirm']()}</label>
							<input
								type="password"
								id="confirmPassword"
								name="confirmPassword"
								class="input input-bordered w-full"
								required
								autocomplete="new-password"
								aria-label={m['profile.password.confirm']()}
							/>
						</div>

						<div class="flex justify-end mt-6">
							<button type="submit" class="btn btn-primary">{m['profile.password.update']()}</button
							>
						</div>

						{#if form?.passwordSuccess}
							<div class="mt-4 alert alert-success">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 0 0118 0z"
									/>
								</svg>
								<span>{m['profile.password.success']()}</span>
							</div>
						{/if}
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
