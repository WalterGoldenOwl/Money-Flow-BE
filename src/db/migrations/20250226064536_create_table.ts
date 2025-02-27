import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('notifications', (table) => {
        table.boolean('is_read').defaultTo(false);
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('notifications', (table) => {
        table.dropColumn('is_read');
    });
}

