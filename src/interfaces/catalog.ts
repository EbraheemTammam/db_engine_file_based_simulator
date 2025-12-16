export type premitive = string | boolean | number | null;

export type data_type = 'INT' | 'TEXT' | 'BOOL' | 'SERIAL';

export interface RelationCatalog {
    id: number,
    name: string,
    rows_count: number
}

export interface AttributeCatalog {
    id: number,
    relation_id: number,
    name: string,
    type: data_type,
    not_null: boolean,
    unique: boolean,
    default: premitive,
    pk: boolean,
    fk: boolean,
    reference?: string
}