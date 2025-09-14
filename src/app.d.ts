// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			user: {
				id: string;
				name: string;
				avatarUrl?: string;
				grants: RoleGrant[];
			} | null;
		}

		interface PageData {
			user?: {
				id: string;
				name: string;
				avatarUrl?: string;
				isAdmin?: boolean;
			} | null;
		}
	}
}

export {};
