import type { SucursalDTO, SucursalOutput, SucursalResponse } from "@/types/Sucursal";

export const obtenerSucursalesApi = async (): Promise<SucursalResponse> => {
    try {
        const res = await fetch(`http://localhost:3000/api/sucursales`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data = await res.json();
        return data as SucursalResponse;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const obtenerSucursalApi = async (id_sucursal: number): Promise<{ success: boolean, message: string, data: SucursalOutput }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/sucursales/${id_sucursal}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        return data as { success: boolean, message: string, data: SucursalOutput };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}

export const insertarSucursalApi = async (sucursalData: SucursalDTO): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/sucursales`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sucursalData)
        });
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data = await res.json();
        return data as { success: boolean, message: string, data: string };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const eliminarSucursalApi = async (id_sucursal: number): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/sucursales/${id_sucursal}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
        });
        const data = await res.json();
        return data as { success: boolean, message: string, data: string };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const actualizarSucursalApi = async (id: number, sucursalData: SucursalDTO): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/sucursales/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sucursalData)
        });
        const data = await res.json();
        return data as { success: boolean, message: string, data: string };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}
