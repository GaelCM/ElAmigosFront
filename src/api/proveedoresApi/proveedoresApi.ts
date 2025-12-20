import type { Proveedor, ProveedorInput, ProveedorResponse } from "@/types/Proveedor";

const URL = "http://localhost:3000/api/proveedores";

export const obtenerProveedoresApi = async (): Promise<ProveedorResponse> => {
    try {
        const res = await fetch(URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        return data as ProveedorResponse;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}

export const obtenerProveedorApi = async (id_proveedor: number): Promise<{ success: boolean, message: string, data: Proveedor }> => {
    try {
        const res = await fetch(`${URL}/${id_proveedor}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            }
        });
        const data = await res.json();
        return data as { success: boolean, message: string, data: Proveedor };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}

export const insertarProveedorApi = async (proveedorData: ProveedorInput): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`${URL}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(proveedorData)
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


export const eliminarProveedorApi = async (id_proveedor: number): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`${URL}/${id_proveedor}`, {
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


export const actualizarProveedorApi = async (id: number, proveedorData: ProveedorInput): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`${URL}/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(proveedorData)
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
