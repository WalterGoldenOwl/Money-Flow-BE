import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('tokens', function (table) {
        table.text('refresh_token').alter();
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('tokens', function (table) {
        table.string('refresh_token').alter();
    });
}
