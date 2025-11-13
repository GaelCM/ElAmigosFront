
export type AuthResponse = {
    success: boolean,
    message: string,
    data: authCredentials,
    token:string,
    ruta:string
}


export type authCredentials={
    id_usuario: number,
    usuario: string,
    email: string,
    id_rol: number,
    rol: string,
    id_sucursal: number,
    sucursal:string
    permisos: menuItem[]
}


type menuItem={
    id_menu:number,
    nombre_menu:string,
    icono:string,
    ruta:string
}