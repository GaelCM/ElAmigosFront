

export interface Usuario {
    id_usuario?: number;
    usuario: string;
    password_hash?: string;
    email: string;
    id_rol: number;
    id_sucursal: number;
    nombre: string;
    nombre_sucursal: string;
}

export interface CreateUsuarioResponse {
    success: boolean;
    message: string;
}


export interface AllUsuariosResponse {
    success: boolean;
    message: string;
    data: Usuario[] | null;
}

export interface CreateUsuario {
    usuario: string;
    password: string;
    email: string;
    id_rol?: number;
    id_sucursal?: number;
    nombre?: string;
}