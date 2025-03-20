import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('notifications', (table) => {
        table.integer('from_category_id').unsigned().nullable()
            .references('id').inTable('categories').onDelete('CASCADE');
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('notifications', (table) => {
        table.dropColumn('from_category_id');
    });
}


