import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
	process.env.JWT_SECRET ?? 'qXORzg9lLYkXyuUQHswY6P3LFyfTsWW7'
);
const issuer = 'meili-album';

type UserClaims = { id: number; name: string };

export const ACCESS_TTL = '30m';
export const REFRESH_TTL = '30d';
export const RENEW_THRESHOLD_SEC = 10 * 60;

export async function signAccess(claims: UserClaims) {
	return new SignJWT(claims)
		.setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
		.setIssuer(issuer)
		.setIssuedAt()
		.setExpirationTime(ACCESS_TTL)
		.sign(secret);
}

export async function signRefresh(claims: UserClaims & { rt?: string }) {
	return new SignJWT({ ...claims })
		.setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
		.setIssuer(issuer)
		.setIssuedAt()
		.setExpirationTime(REFRESH_TTL)
		.sign(secret);
}

export async function verify(token: string) {
	return jwtVerify(token, secret, { issuer });
}

export type Verified<T extends object = UserClaims> = {
	payload: T & { exp?: number; iat?: number };
};
