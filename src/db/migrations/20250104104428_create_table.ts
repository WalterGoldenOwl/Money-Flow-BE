import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('fullname').notNullable();
        table.string('email').notNullable().unique();
        table.string('password').notNullable();
        table.dateTime('updatedAt').notNullable();
        table.dateTime('createdAt').notNullable();
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('users');
}

