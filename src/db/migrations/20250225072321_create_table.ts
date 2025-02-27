import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('notifications', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().notNullable()
            .references('id').inTable('users').onDelete('CASCADE');
        table.integer('category_id').unsigned().notNullable()
            .references('id').inTable('categories').onDelete('CASCADE');
        table.integer('transaction_id').unsigned().notNullable()
            .references('id').inTable('transactions').onDelete('CASCADE');
        table.string('type').notNullable();
        table.timestamps(true, true);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('notifications');
}

