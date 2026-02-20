import type { CarritoPayload } from "@/types/Venta";


export const nuevaVentaApi = async (formData: CarritoPayload) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/ventas/nuevaVenta`, {
        method: "post",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        // Enviar el payload directamente, no envuelto en { formData }
        body: JSON.stringify(formData)
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: number | null };
}


export const cancelarVentaApi = async (id_venta: number, id_usuario: number) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/ventas/cancelarVenta`, {
        method: "put",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_venta, id_usuario })
    });
    const data = await res.json();
    return data as { success: boolean, message: string };
}


export const cancelarProductoVentaApi = async (id_detalle_venta: number, id_usuario: number, cantidad?: number) => {
    const res = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/ventas/cancelarProductoVenta`, {
        method: "put",
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_detalle_venta, id_usuario, cantidad })
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: number | null };
}





