import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (table) {
        table.boolean('is_verify').defaultTo(false);
        table.dateTime('verified_at');
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (table) {
        table.dropColumn('is_verify');
        table.dropColumn('verified_at');
    });
}
