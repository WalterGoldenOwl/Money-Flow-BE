import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('categories', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('icon').notNullable();
        table.string('type').notNullable();
        table.timestamps(true, true);
    });

    await knex.schema.createTable('transactions', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.integer('category_id').unsigned().notNullable()
            .references('id').inTable('categories').onDelete('CASCADE');
        table.double('amount').notNullable();
        table.string('description');
        table.string('attachment');
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('transactions');
    await knex.schema.dropTableIfExists('categories');
}

