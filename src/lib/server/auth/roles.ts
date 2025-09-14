// src/lib/server/roles.ts
export type Verb = 'read' | 'write' | 'admin' | string;

export type RoleGrant = {
	verbs: Set<Verb>;
	scope: string;
};

export function parseRoles(rolesStr: string): RoleGrant[] {
	if (!rolesStr?.trim()) return [];
	return rolesStr
		.split(';')
		.map((chunk) => chunk.trim())
		.filter(Boolean)
		.map((chunk) => {
			const [verbPart, scopePart] = chunk.split('@');
			const verbs = new Set(
				(verbPart ?? '')
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			);
			const scope = (scopePart ?? '').trim();
			return { verbs, scope };
		});
}

function matchScope(grantScope: string, wantScope: string): boolean {
	if (grantScope === '*' || grantScope === '*/' || grantScope === '/*') return true;
	if (grantScope.endsWith('/*')) {
		const prefix = grantScope.slice(0, -2);
		return wantScope === prefix || wantScope.startsWith(prefix + '/');
	}
	return grantScope === wantScope;
}

export function isAllowed(grants: RoleGrant[], verb: Verb, scope: string): boolean {
	for (const g of grants) {
		if (g.verbs.has('admin')) return true;
		if (g.verbs.has(verb) && matchScope(g.scope, scope)) return true;
	}
	return false;
}

export function stringifyRolesV1(grants: RoleGrant[]): string {
	return grants.map((g) => `${[...g.verbs].join(',')}@${g.scope}`).join(';');
}
