
export type AuthResponse = {
    success: boolean,
    message: string,
    data: authCredentials,
    token: string,
    ruta: string
}


export type authCredentials = {
    id_usuario: number,
    usuario: string,
    email: string,
    id_rol: number,
    rol: string,
    id_sucursal: number,
    sucursal: string
    permisos: menuItem[],
    direccion_sucursal: string,
    telefono_sucursal: string
}


type menuItem = {
    id_menu: number,
    nombre_menu: string,
    icon: string,
    ruta: string
}