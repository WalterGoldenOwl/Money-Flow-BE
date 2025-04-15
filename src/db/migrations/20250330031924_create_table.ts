import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (table) {
        table.string('language').defaultTo("vi");
        table.string('country').defaultTo("VN");
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (table) {
        table.dropColumn('language');
        table.dropColumn('country');
    });
}

