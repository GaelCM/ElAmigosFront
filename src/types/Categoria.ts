export interface Categoria {
    id_categoria: number;
    category_name: string;
    estatus: number;
}

export interface CategoriaDTO {
    category_name: string;
    estatus?: number;
}

export interface CategoriaResponse {
    success: boolean;
    message: string;
    data: Categoria[];
}

export interface CategoriaSingleResponse {
    success: boolean;
    message: string;
    data: Categoria;
}
