export type premitive = string | boolean | number | null;

export type data_type = 'INT' | 'TEXT' | 'BOOL' | 'SERIAL';

export interface RelationCatalog {
    name: string,
    row_count: number
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

export const RelationCatalogDataTypes: data_type[] = ['TEXT', 'INT']
export const AttributeCatalogDataTypes: data_type[] = ['TEXT', 'TEXT', 'INT', 'TEXT', 'BOOL', 'BOOL', 'TEXT', 'BOOL', 'BOOL', 'TEXT'];