import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull(),
	password: text('password').notNull(),
	avatarUrl: text('avatar_url').default(''),
	roles: text('roles').notNull().default('read@public')
});

export const inviteCode = sqliteTable('invite_code', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').notNull(),
	valid: integer({ mode: 'boolean' }).default(false)
});
