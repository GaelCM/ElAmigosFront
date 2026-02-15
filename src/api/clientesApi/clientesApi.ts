import type { Cliente } from "@/types/Cliente";

const API_URL = "https://elamigos-elamigosapi.xj7zln.easypanel.host/api/clientes";

const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
    'Content-Type': 'application/json'
});

export const getClientes = async () => {
    const res = await fetch(API_URL, {
        method: "GET",
        headers: getHeaders()
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: Cliente[] };
}

export const getClienteById = async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "GET",
        headers: getHeaders()
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: Cliente };
}

export const createCliente = async (cliente: Omit<Cliente, 'id_cliente'>) => {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(cliente)
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: number };
}

export const updateCliente = async (id: number, cliente: Partial<Cliente>) => {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(cliente)
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: number };
}

export const deleteCliente = async (id: number) => {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    });
    const data = await res.json();
    return data as { success: boolean, message: string, data: number };
}
