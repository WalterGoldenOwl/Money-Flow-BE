import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('fcm_tokens', (table) => {
        table.string('device_id').nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('fcm_tokens', (table) => {
        table.dropColumn('device_id');
    });
}

