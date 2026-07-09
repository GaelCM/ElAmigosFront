import type { CompletarPedidoPayload, CrearPedidoPayload, Pedido } from "@/types/Pedido";

const API_URL = "https://elamigos-elamigosapi.xj7zln.easypanel.host/api/pedidos";

const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
    'Content-Type': 'application/json'
});

declare global {
    interface Window {
        'electron-api': any;
    }
}

// GET /pedidos?id_sucursal=X  (sin filtro de estado → todos)
// GET /pedidos?id_sucursal=X&estado=0 → pendientes
// GET /pedidos?id_sucursal=X&estado=1 → preparados
export async function obtenerPedidosApi(id_sucursal: number, estado?: 0 | 1 | 2 | 3): Promise<{ success: boolean; data: Pedido[]; message?: string }> {
    const params = new URLSearchParams({ id_sucursal: String(id_sucursal) });
    if (estado !== undefined) params.append("estado", String(estado));

    const res = await fetch(`${API_URL}?${params.toString()}`, {
        method: "GET",
        headers: getHeaders(),
    });
    return res.json();
}

// GET /pedidos/:idPedido
export async function obtenerPedidoApi(idPedido: number): Promise<{ success: boolean; data: Pedido; message?: string }> {
    const res = await fetch(`${API_URL}/${idPedido}`, {
        method: "GET",
        headers: getHeaders(),
    });
    return res.json();
}

// POST /pedidos/nuevoPedido
export async function crearPedidoApi(payload: CrearPedidoPayload): Promise<{ success: boolean; data: number; message?: string }> {
    const res = await fetch(`${API_URL}/nuevoPedido`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json();
}

// PUT /pedidos/editar/:idPedido
export async function editarPedidoApi(idPedido: number, payload: CrearPedidoPayload): Promise<{ success: boolean; data?: number; message?: string }> {
    const res = await fetch(`${API_URL}/editar/${idPedido}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json();
}

// PUT /pedidos/aPreparado/:idPedido
export async function marcarPreparadoApi(idPedido: number): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_URL}/aPreparado/${idPedido}`, {
        method: "PUT",
        headers: getHeaders(),
    });
    return res.json();
}

// PUT /pedidos/cancelado/:idPedido
export async function cancelarPedidoApi(idPedido: number): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_URL}/cancelado/${idPedido}`, {
        method: "PUT",
        headers: getHeaders(),
    });
    return res.json();
}

// POST /pedidos/completar/:idPedido
export async function completarPedidoApi(idPedido: number, payload: CompletarPedidoPayload): Promise<{ success: boolean; data?: { id_pedido: number; id_venta: number }; message?: string }> {
    const res = await fetch(`${API_URL}/completar/${idPedido}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json();
}