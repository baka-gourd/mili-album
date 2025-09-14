import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username'),
	password: text('password'),
	avatarUrl: text('avatar'),
	roles: text('roles')
});
