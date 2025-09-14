<script lang="ts">
	import { setLocale } from '$lib/paraglide/runtime';
	import { goto } from '$app/navigation';

	// 定义用户类型
	type User = {
		id: string;
		name: string;
		avatarUrl?: string;
		isAdmin?: boolean;
	};

	let { appName = 'My App', user }: { appName?: string; user?: User | null } = $props();

	function handleLogin() {
		goto('/login');
	}
	function handleLogout() {
		location.href = '/logout';
	}

	async function switchLocale(code: 'en' | 'zh-cn') {
		await setLocale(code);
	}
</script>

<div
	class="navbar fixed top-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur border-b border-base-200"
>
	<div class="flex-1">
		<a href="/" class="btn btn-ghost text-xl font-semibold">{appName}</a>
	</div>

	<div class="flex items-center gap-2">
		<details class="dropdown dropdown-end">
			<summary class="btn btn-circle m-1" title="Language">
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
					class="lucide lucide-globe"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
					<path d="M2 12h20" />
				</svg>
			</summary>
			<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-44 p-2 shadow-sm">
				<li>
					<button class="btn btn-ghost justify-start" onclick={() => switchLocale('zh-cn')}
						>简体中文</button
					>
				</li>
				<li>
					<button class="btn btn-ghost justify-start" onclick={() => switchLocale('en')}
						>English</button
					>
				</li>
			</ul>
		</details>

		{#if !user}
			<button class="btn btn-primary" onclick={handleLogin}>Log in</button>
		{:else}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
					<div class="avatar">
						<div class="w-10 rounded-full">
							{#if user.avatarUrl}
								<img src={user.avatarUrl} alt={user.name} />
							{:else}
								<div class="w-full h-full grid place-items-center bg-base-300">
									<span class="font-bold">{user.name?.[0] ?? 'U'}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<ul class="menu dropdown-content z-[1] p-2 shadow bg-base-100 rounded-box w-52 mt-4">
					<li class="menu-title px-4 py-2">
						<span class="text-primary">欢迎，{user.name}</span>
					</li>
					<li><a href="/profile">个人资料</a></li>
					{#if user.isAdmin}
						<li><a href="/admin">管理面板</a></li>
					{/if}
					<li class="mt-2"><button class="text-error" onclick={handleLogout}>退出登录</button></li>
				</ul>
			</div>
		{/if}
	</div>
</div>
