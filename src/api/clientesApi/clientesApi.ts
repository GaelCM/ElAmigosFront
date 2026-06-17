import type { Cliente } from "@/types/Cliente";

const API_URL = "https://elamigos-elamigosapi.xj7zln.easypanel.host/api/clientes";

const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('tkn')}`,
    'Content-Type': 'application/json'
});

declare global {
    interface Window {
        'electron-api': any;
    }
}

export const getClientes = async () => {
    try {
        let localData: Cliente[] = [];
        if (window['electron-api']?.obtenerClientesLocal) {
            const localRes = await window['electron-api'].obtenerClientesLocal();
            if (localRes.success) {
                localData = localRes.data;
            }
        }

        const fetchOnline = async () => {
            try {
                const res = await fetch(API_URL, {
                    method: "GET",
                    headers: getHeaders()
                });
                const data = await res.json();
                if (data.success && window['electron-api']?.sincronizarClientes) {
                    await window['electron-api'].sincronizarClientes(data.data);
                }
                return data;
            } catch (err) {
                console.error("Error fetching online clients:", err);
                return null;
            }
        };

        if (localData.length > 0) {
            fetchOnline(); // sync in background
            return { success: true, message: "Clientes obtenidos localmente", data: localData };
        } else {
            const data = await fetchOnline();
            if (data) {
                return data as { success: boolean, message: string, data: Cliente[] };
            }
            return { success: false, message: "No se pudieron obtener los clientes", data: [] };
        }
    } catch (error) {
        console.error("Error in getClientes:", error);
        return { success: false, message: "Error interno", data: [] };
    }
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
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(cliente)
        });
        const data = await res.json();

        if (data.success && window['electron-api']?.crearClienteLocal) {
            await window['electron-api'].crearClienteLocal({
                ...cliente,
                id_cliente: data.data
            });
        }

        return data as { success: boolean, message: string, data: number };
    } catch (error) {
        return { success: false, message: "Error de red", data: 0 };
    }
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
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        const data = await res.json();

        if (data.success && window['electron-api']?.eliminarClienteLocal) {
            await window['electron-api'].eliminarClienteLocal(id);
        }

        return data as { success: boolean, message: string, data: number };
    } catch (error) {
        return { success: false, message: "Error de red", data: 0 };
    }
}
