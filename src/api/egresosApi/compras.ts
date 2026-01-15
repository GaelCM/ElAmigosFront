
import type { Compra, CompraPayload, CompraUpdateInput } from "@/types/Egresos";



export const crearCompra = async (data: CompraPayload) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/nuevaCompra`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al registrar la compra");
    }

    return await res.json() as { success: boolean, message: string, data: { id_compra: number, fecha_compra: string } };
}

export const obtenerCompras = async (data: { id_rol: number, id_sucursal: number, id_turno?: number, fecha_desde?: string, fecha_hasta?: string }) => {

    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/compras`, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al obtener compras");
    }

    const responseData = await res.json()

    return responseData as { success: boolean, message: string, data: Compra[] }
}

export const actualizarCompra = async (data: CompraUpdateInput) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/egresos/actualizarCompra`, {
        method: "PUT",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar la compra");
    }

    return await res.json() as { success: boolean, message: string };
}
