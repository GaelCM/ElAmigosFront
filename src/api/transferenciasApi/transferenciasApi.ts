import type { ProductoVentaResponse } from "@/types/Producto";
import type { DetalleTransferenciaDTO, NuevaTransferenciaDTO, RecibirTransferenciaDTO, TransferenciaDTO } from "@/types/Transferencias";


export const obtenerProductosTransferirApi = async (idSucursal: string): Promise<ProductoVentaResponse> => {
    try {
        const res = await fetch(`http://localhost:3000/api/transferencias/productos/${idSucursal}`, {
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
        return data as ProductoVentaResponse;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}

export const nuevaTransferenciaApi = async (formData: NuevaTransferenciaDTO): Promise<{ success: boolean, message: string, data: number }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/transferencias/nueva-transferencia`, {
            method: "post",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data = await res.json();
        return data as { success: boolean, message: string, data: number }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const obtenerTransferenciasApi = async (id_usuario: number, id_rol: number, fecha_desde: string, fecha_hasta: string): Promise<{ success: boolean, message: string, data: TransferenciaDTO[] }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/transferencias/getTransferencias`, {
            method: "post",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idUsuario: id_usuario,
                idRol: id_rol,
                fechaDesde: fecha_desde,
                fechaHasta: fecha_hasta
            })
        });
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data = await res.json();
        return data as { success: boolean, message: string, data: TransferenciaDTO[] }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const obtenerTransferenciasPendientesApi = async (id_sucursal: number): Promise<{ success: boolean, message: string, data: TransferenciaDTO[] }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/transferencias/pendientes/${id_sucursal}`, {
            method: "get",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
        });
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data = await res.json();
        return data as { success: boolean, message: string, data: TransferenciaDTO[] }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}

export const enviarTransferenciasApi = async (id_transferencia: number, id_usuario: number): Promise<{ success: boolean, message: string, data: number }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/transferencias/enviar/${id_transferencia}/${id_usuario}`, {
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
        return data as { success: boolean, message: string, data: number };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}


export const obtenerDetalleTransferenciaApi = async (id_transferencia: number): Promise<{ success: boolean, message: string, data: DetalleTransferenciaDTO }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/transferencias/detalle/${id_transferencia}`, {
            method: "get",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
        });
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data = await res.json();
        return data as { success: boolean, message: string, data: DetalleTransferenciaDTO };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}

export const recibirYAutorizarTransferenciaApi = async (id_transferencia: number, datos: RecibirTransferenciaDTO): Promise<{ success: boolean, message: string }> => {
    try {
        const res = await fetch(`http://localhost:3000/api/transferencias/recibir`, {
            method: "post",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                idTransferencia: id_transferencia,
                datos: datos
            })
        });
        if (!res.ok) {
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data = await res.json();
        return data as { success: boolean, message: string }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error instanceof TypeError) {
            // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
            throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }

}
