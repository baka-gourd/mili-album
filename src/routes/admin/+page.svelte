<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages';
	import { goto } from '$app/navigation';

	export let data;

	// Local state
	let editingUserId: number | null = null;
	let editFormData = {
		username: '',
		password: '',
		roles: ''
	};

	// Initialize activeTab from URL parameter or default to 'users'
	let activeTab = page.url.searchParams.get('tab') || 'users';

	// Watch for URL changes to update the active tab
	$: if (page.url.searchParams.get('tab')) {
		activeTab = page.url.searchParams.get('tab') || 'users';
	}

	let newInviteCode = '';
	let newInviteCodeValid = true;

	// Delete confirmation data
	type DeleteConfirmData = { id: number; type: 'user' | 'code' } | null;
	let showDeleteConfirm: DeleteConfirmData = null;

	// Error handling and success handling
	let errorMessage = page.form?.error || '';
	let successMessage = page.form?.message || '';
	let newUserCredentials =
		page.form?.success && page.form?.username && page.form?.password
			? {
					username: page.form.username,
					password: page.form.password
				}
			: null;

	// Define user type based on schema
	type User = {
		id: number;
		username: string;
		password: string;
		roles: string;
		avatarUrl?: string | null;
	};

	// Define invite code type based on schema
	type InviteCode = {
		id: number;
		code: string;
		valid: boolean;
	};

	// Function to start editing a user
	function startEdit(user: User) {
		editingUserId = user.id;
		editFormData = {
			username: user.username,
			password: '', // Don't display the current password
			roles: user.roles
		};
	}

	// Function to cancel editing
	function cancelEdit() {
		editingUserId = null;
		errorMessage = '';
		successMessage = '';
	}

	// Function to request delete confirmation
	function confirmDelete(id: number, type: 'user' | 'code') {
		showDeleteConfirm = { id, type };
	}

	// Function to cancel delete
	function cancelDelete() {
		showDeleteConfirm = null;
	}

	// Function to switch tabs with URL parameter
	function switchTab(tab: string) {
		activeTab = tab;
		const url = new URL(page.url);
		url.searchParams.set('tab', tab);
		goto(url.toString(), { replaceState: true, noScroll: true });
	}

	// Form submission handler
	function handleSubmit() {
		return ({ result }: { result: { type: string; data?: { error?: string } } }) => {
			if (result.type === 'success') {
				successMessage = m['admin.success']();
				editingUserId = null;
				errorMessage = '';
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			} else if (result.type === 'failure') {
				errorMessage = result.data?.error || m['admin.err.updateError']();
				successMessage = '';
			}
		};
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">{m['admin.title']()}</h1>
	</div>

	{#if errorMessage}
		<div class="alert alert-error mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="stroke-current shrink-0 h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<span>{errorMessage}</span>
		</div>
	{/if}

	{#if successMessage}
		<div class="alert alert-success mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="stroke-current shrink-0 h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/></svg
			>
			<span>{successMessage}</span>
		</div>
	{/if}

	{#if newUserCredentials}
		<div class="alert alert-info mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				class="stroke-current shrink-0 w-6 h-6"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<div>
				<span class="font-bold">新用户已创建!</span>
				<div class="mt-1">用户名: <span class="font-mono">{newUserCredentials.username}</span></div>
				<div>密码: <span class="font-mono">{newUserCredentials.password}</span></div>
				<div class="text-sm mt-1">请保存这些凭据，它们只会显示一次!</div>
			</div>
		</div>
	{/if}

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-border">
		<button
			role="tab"
			tabindex="0"
			class="tab {activeTab === 'users' ? 'tab-active' : ''}"
			on:click={() => switchTab('users')}
		>
			{m['admin.tabs.users']()}
		</button>
		<button
			role="tab"
			tabindex="0"
			class="tab {activeTab === 'inviteCodes' ? 'tab-active' : ''}"
			on:click={() => switchTab('inviteCodes')}
		>
			{m['admin.tabs.inviteCodes']()}
		</button>
	</div>

	<!-- Users Tab -->
	{#if activeTab === 'users'}
		<div class="flex justify-end mb-4">
			<form
				method="POST"
				action="?/registerUser&tab={activeTab}"
				class="flex flex-col md:flex-row gap-2 items-end"
			>
				<input
					type="text"
					name="username"
					class="input input-bordered w-full md:w-56"
					placeholder={m['admin.username']() + ' (' + m['admin.customValue']() + ')'}
				/>
				<input
					type="password"
					name="password"
					class="input input-bordered w-full md:w-56"
					placeholder={m['admin.password']() + ' (' + m['admin.customValue']() + ')'}
				/>
				<button type="submit" class="btn btn-success">
					{m['admin.register']()} +
				</button>
			</form>
		</div>

		<div class="overflow-x-auto">
			<table class="table table-zebra">
				<thead>
					<tr>
						<th>ID</th>
						<th>{m['admin.username']()}</th>
						<th>{m['admin.roles']()}</th>
						{#if editingUserId !== null}
							<th>{m['admin.password']()}</th>
						{/if}
						<th>{m['admin.actions']()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as user}
						<tr class="hover">
							<td>{user.id}</td>
							<td>
								{#if editingUserId === user.id}
									<input
										type="text"
										class="input input-bordered w-full max-w-xs"
										bind:value={editFormData.username}
									/>
								{:else}
									{user.username}
								{/if}
							</td>
							<td>
								{#if editingUserId === user.id}
									<input
										type="text"
										class="input input-bordered w-full max-w-xs"
										bind:value={editFormData.roles}
									/>
								{:else}
									{user.roles}
								{/if}
							</td>
							{#if editingUserId === user.id}
								<td>
									<input
										type="password"
										name="password"
										class="input input-bordered w-full max-w-xs"
										bind:value={editFormData.password}
										placeholder={m['admin.newPassword']()}
									/>
								</td>
							{/if}
							<td>
								{#if editingUserId === user.id}
									<form
										method="POST"
										action="?/updateUser&tab={activeTab}"
										use:enhance={handleSubmit}
										class="flex gap-2"
									>
										<input type="hidden" name="userId" value={user.id} />
										<input type="hidden" name="username" value={editFormData.username} />
										<input type="hidden" name="roles" value={editFormData.roles} />
										<input type="hidden" name="password" value={editFormData.password} />

										<button type="submit" class="btn btn-primary btn-sm">{m['admin.save']()}</button
										>
										<button type="button" class="btn btn-ghost btn-sm" on:click={cancelEdit}>
											{m['admin.cancel']()}
										</button>
									</form>
								{:else}
									<div class="flex gap-2">
										<button class="btn btn-primary btn-sm" on:click={() => startEdit(user)}>
											{m['admin.edit']()}
										</button>
										<button
											class="btn btn-error btn-sm"
											on:click={() => confirmDelete(user.id, 'user')}
										>
											{m['admin.delete']()}
										</button>
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Invite Codes Tab -->
	{#if activeTab === 'inviteCodes'}
		<div class="card bg-base-100 shadow-md mb-6">
			<div class="card-body">
				<h2 class="card-title">{m['admin.createCode']()}</h2>
				<form
					method="POST"
					action="?/createInviteCode&tab={activeTab}"
					class="flex flex-col md:flex-row gap-4 items-end"
				>
					<div class="form-control w-full max-w-xs">
						<input
							type="text"
							name="code"
							class="input input-bordered"
							placeholder={m['admin.customCode']()}
							bind:value={newInviteCode}
						/>
					</div>

					<div class="form-control">
						<label class="label cursor-pointer">
							<input
								type="checkbox"
								name="valid"
								value="true"
								class="checkbox"
								checked={newInviteCodeValid}
								on:change={() => (newInviteCodeValid = !newInviteCodeValid)}
							/>
							{m['admin.active']()}
						</label>
					</div>

					<button type="submit" class="btn btn-primary">{m['admin.createCode']()}</button>
				</form>
			</div>
		</div>

		<div class="overflow-x-auto">
			<table class="table table-zebra">
				<thead>
					<tr>
						<th>ID</th>
						<th>{m['admin.codeValue']()}</th>
						<th>{m['admin.codeStatus']()}</th>
						<th>{m['admin.actions']()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.codes as code}
						<tr class="hover">
							<td>{code.id}</td>
							<td>{code.code}</td>
							<td>
								<div class="badge {code.valid ? 'badge-success' : 'badge-error'}">
									{code.valid ? m['admin.active']() : m['admin.inactive']()}
								</div>
							</td>
							<td>
								<div class="flex gap-2">
									<form method="POST" action="?/toggleInviteCode&tab={activeTab}">
										<input type="hidden" name="codeId" value={code.id} />
										<button type="submit" class="btn btn-primary btn-sm">
											{m['admin.toggleStatus']()}
										</button>
									</form>
									<button
										class="btn btn-error btn-sm"
										on:click={() => confirmDelete(code.id, 'code')}
									>
										{m['admin.delete']()}
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="modal modal-open">
			<div class="modal-box">
				<h3 class="font-bold text-lg">{m['admin.confirmDelete']()}</h3>
				<p class="py-4">
					{#if showDeleteConfirm.type === 'user'}
						{m['admin.confirmDelete']()} ID: {showDeleteConfirm.id}
					{:else}
						{m['admin.confirmDelete']()} ID: {showDeleteConfirm.id}
					{/if}
				</p>
				<div class="modal-action">
					<form
						method="POST"
						action={showDeleteConfirm.type === 'user'
							? `?/deleteUser&tab=${activeTab}`
							: `?/deleteInviteCode&tab=${activeTab}`}
					>
						<input
							type="hidden"
							name={showDeleteConfirm.type === 'user' ? 'userId' : 'codeId'}
							value={showDeleteConfirm.id}
						/>
						<button type="submit" class="btn btn-error">{m['admin.delete']()}</button>
					</form>
					<button class="btn" on:click={cancelDelete}>{m['admin.cancel']()}</button>
				</div>
			</div>
		</div>
	{/if}
</div>
