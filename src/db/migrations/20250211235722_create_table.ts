import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('transactions', function (table) {
        table.timestamp('date_created').defaultTo(knex.fn.now());
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('transactions', function (table) {
        table.dropColumn('date_created');
    });
}

