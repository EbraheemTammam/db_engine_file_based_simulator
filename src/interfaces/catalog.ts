export type premitive = string | boolean | number | null;

export type data_type = 'INT' | 'TEXT' | 'BOOL' | 'SERIAL';

export interface RelationCatalog {
    name: string,
    column_count: number,
    row_count: number,
    page_count: number,
    last_index: number
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