export type premitive = string | boolean | number | null;

export type data_type = 'INT' | 'TEXT' | 'BOOL' | 'SERIAL';

export interface RelationCatalog {
    name: string
}

export interface AttributeCatalog {
    relation: string,
    name: string,
    type: data_type,
    not_null: boolean,
    unique: boolean,
    default: premitive,
    pk: boolean,
    fk: boolean,
    reference?: string
}