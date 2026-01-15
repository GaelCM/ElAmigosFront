import type { AllUsuariosResponse, CreateUsuario, CreateUsuarioResponse } from "@/types/Usuarios";


export const obtenerUsuariosApi = async (): Promise<AllUsuariosResponse> => {
    try {
        const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/usuarios`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        return data as AllUsuariosResponse;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const crearUsuarioApi = async (newUser: CreateUsuario): Promise<CreateUsuarioResponse> => {
    try {
        const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/usuarios`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: newUser.usuario,
                password: newUser.password,
                email: newUser.email,
                id_rol: newUser.id_rol,
                id_sucursal: newUser.id_sucursal,
                nombre: newUser.nombre
            })
        });
        const data = await res.json();
        return data as CreateUsuarioResponse;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const actualizarUsuarioApi = async (id: number, newUser: CreateUsuario): Promise<CreateUsuarioResponse> => {
    try {
        const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/usuarios/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario: newUser.usuario,
                password: newUser.password,
                email: newUser.email,
                id_rol: newUser.id_rol,
                id_sucursal: newUser.id_sucursal,
                nombre: newUser.nombre
            })
        });
        const data = await res.json();
        return data as CreateUsuarioResponse;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}