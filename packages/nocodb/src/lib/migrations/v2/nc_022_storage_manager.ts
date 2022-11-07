import { Knex } from 'knex';
import { MetaTable } from '../../utils/globals';

const up = async (knex: Knex) => {
  await knex.schema.createTable(MetaTable.STORAGES, (table) => {
    table.string('id', 20).primary().notNullable();
    table.string('base_id', 20);
    table.foreign('base_id').references(`${MetaTable.BASES}.id`);
    table.string('project_id', 128);
    table.foreign('project_id').references(`${MetaTable.PROJECT}.id`);
    table.string('source');
    table.text('meta');
    table.timestamps();
  });
};

const down = async (knex) => {
  await knex.schema.dropTable(MetaTable.STORAGES);
};

export { up, down };
