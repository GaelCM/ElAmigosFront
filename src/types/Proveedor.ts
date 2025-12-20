

export interface Proveedor {
    id_proveedor: number;
    nombre_proveedor: string;
    telefono: string;
    isactive: number;
}

export interface ProveedorResponse {
    success: boolean;
    message: string;
    data: Proveedor[];
}

export interface ProveedorInput {
    nombre_proveedor: string;
    telefono: string;
    isactive: number;
}