import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.string('avatar').nullable();
        table.string('currency').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('avatar');
        table.dropColumn('currency');
    });
}

