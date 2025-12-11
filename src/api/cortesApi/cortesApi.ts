import type { nuevoCorte, CerrarCorteBody, CerrarCorteResponse } from "@/types/Cortes"


export const existCorteApi = async (id_usuario: number, id_sucursal: number): Promise<{
    success: boolean, message: string, data: {
        existe: boolean;
        id_turno: number;
        fecha_apertura: string;
        estado: string;
    }
}> => {
    const res = await fetch("https://elamigos-elamigosapi.xj7zln.easypanel.host/api/cortes/exist", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id_usuario, id_sucursal }),
    })
    const data = await res.json()
    return data as { success: boolean, message: string, data: { existe: boolean; id_turno: number; fecha_apertura: string; estado: string; } }
}


export const nuevoCorteApi = async (corte: nuevoCorte): Promise<{ success: boolean, message: string, data: { id_turno: number, fecha_apertura: string } }> => {
    const res = await fetch("https://elamigos-elamigosapi.xj7zln.easypanel.host/api/cortes/iniciar-corte", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(corte),
    })
    const data = await res.json()
    return data as { success: boolean, message: string, data: { id_turno: number, fecha_apertura: string } }
}

export const cerrarCorteApi = async (corte: CerrarCorteBody): Promise<{ success: boolean, message: string, data: CerrarCorteResponse }> => {
    const res = await fetch("https://elamigos-elamigosapi.xj7zln.easypanel.host/api/cortes/cerrar", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(corte),
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.message || 'Error al cerrar caja');
    }
    return data as { success: boolean, message: string, data: CerrarCorteResponse }
}
