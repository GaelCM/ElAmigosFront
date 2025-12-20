
import type { Gasto, GastoPayload, GastoUpdateInput } from "@/types/Egresos";

export const crearGasto = async (data: GastoPayload) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/nuevoGasto`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al registrar el gasto");
    }
    const responseData = await res.json();
    return responseData as { success: boolean, message: string, data: { id_gasto: number, fecha_gasto: string } };
}

export const obtenerGastos = async (data: { id_rol: number, id_sucursal: number, id_turno?: number, fecha_desde?: string, fecha_hasta?: string }) => {

    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/gastos`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al obtener gastos");
    }

    const responseData = await res.json();
    return responseData as { success: boolean, message: string, data: Gasto[] }
}

export const actualizarGasto = async (data: GastoUpdateInput) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/actualizarGasto`, {
        method: "PUT",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar el gasto");
    }
    const responseData = await res.json();
    return responseData as { success: boolean, message: string, data: { id_gasto: number, fecha_gasto: string } };
}

