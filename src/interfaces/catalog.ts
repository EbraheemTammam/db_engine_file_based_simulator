export type premitive = string | boolean | number | null;

export type data_type = 'INT' | 'TEXT' | 'BOOL' | 'SERIAL';

export interface RelationCatalog {
    name: string,
    column_count: number,
    row_count: number,
    page_count: number
}

export interface AttributeCatalog {
    relation: string,
    name: string,
    index: number,
    type: data_type,
    not_null: boolean,
    unique: boolean,
    default: premitive,
    pk: boolean,
    fk: boolean,
    reference?: string
}

export const RELATION_CATALOG_DATATYPES: data_type[] = ['TEXT', 'INT', 'INT', 'INT']
export const ATTRIBUTE_CATALOG_DATATYPES: data_type[] = ['TEXT', 'TEXT', 'INT', 'TEXT', 'BOOL', 'BOOL', 'TEXT', 'BOOL', 'BOOL', 'TEXT'];

export const RELATION_SCHEMA_FILE = 'database/schema/relations.csv';
export const ATTRIBUTE_SCHEMA_FILE = 'database/schema/attributes.csv';