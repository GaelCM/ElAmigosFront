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

export const obtenerReporteCortesApi = async (fecha_desde: string, fecha_hasta: string, id_sucursal?: number): Promise<{ success: boolean, message: string, data: any[] }> => {
    const res = await fetch("https://elamigos-elamigosapi.xj7zln.easypanel.host/api/cortes/reporte-cortes", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fecha_desde, fecha_hasta, id_sucursal }),
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.message || 'Error al obtener el reporte de cortes');
    }
    return data as { success: boolean, message: string, data: any[] }
}

export const obtenerDetalleTurnoApi = async (id_turno: number): Promise<{ success: boolean, data: any, message: string }> => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/dashboard/${id_turno}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
            "Content-Type": "application/json",
        }
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.message || 'Error al obtener el detalle del turno');
    }
    return data as { success: boolean, data: any, message: string }
}

