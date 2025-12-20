
import type { MovimientoEfectivo, MovimientoEfectivoUpdateInput, MovimientoPayload } from "@/types/Egresos";



export const crearMovimiento = async (data: MovimientoPayload) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/nuevoMovimiento`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al registrar el movimiento");
    }
    const responseData = await res.json();
    return responseData as { success: boolean, message: string, data: { id_movimiento: number, fecha_movimiento: string } };
}

export const obtenerMovimientos = async (data: { id_rol: number, id_sucursal: number, id_turno?: number, fecha_desde?: string, fecha_hasta?: string }) => {

    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/movimientos`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al obtener movimientos");
    }

    const responseData = await res.json();
    return responseData as { success: boolean, message: string, data: MovimientoEfectivo[] };
}

export const actualizarMovimiento = async (data: MovimientoEfectivoUpdateInput) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/actualizarMovimiento`, {
        method: "PUT",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar el movimiento");
    }
    const responseData = await res.json();
    return responseData as { success: boolean, message: string, data: { id_movimiento: number, fecha_movimiento: string } };
}
