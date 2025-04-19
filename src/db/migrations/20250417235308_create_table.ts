import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (table) {
        table.string('google_id');
        table.string('sign_up_type').defaultTo("email");
        table.string('password').nullable().alter();
        table.boolean('is_need_password').defaultTo(false);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.alterTable('users', function (table) {
        table.dropColumn('google_id');
        table.dropColumn('sign_up_type');
        table.dropColumn('is_need_password');
        table.string('password').notNullable().alter();
    });
}

