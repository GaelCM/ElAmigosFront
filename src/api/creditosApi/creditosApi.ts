import type {
    AbonoPayload,
    ClienteResagado,
    ConfigurarCreditoPayload,
    CreditoCliente,
    CreditoClienteCompleto,
    LiquidarDeudaPayload,
    MovimientoCredito,
    ResumenCartera,
} from "@/types/Creditos";

const API_URL = "https://elamigos-elamigosapi.xj7zln.easypanel.host/api/creditos";

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("tkn")}`,
    "Content-Type": "application/json",
});

type ApiResponse<T> = { success: boolean; message?: string; data: T };

// ── Consultas ─────────────────────────────────────────────

/** Todos los créditos activos de un jalón — sin N+1 */
export const getTodosCreditos = async () => {
    const res = await fetch(`${API_URL}/todos`, { headers: getHeaders() });
    return res.json() as Promise<ApiResponse<CreditoClienteCompleto[]>>;
};

export const getCreditoCliente = async (id_cliente: number) => {
    const res = await fetch(`${API_URL}/cliente/${id_cliente}`, { headers: getHeaders() });
    return res.json() as Promise<ApiResponse<CreditoCliente>>;
};

export const getHistorialCliente = async (id_cliente: number) => {
    const res = await fetch(`${API_URL}/historial/${id_cliente}`, { headers: getHeaders() });
    return res.json() as Promise<ApiResponse<MovimientoCredito[]>>;
};

export const getClientesResagados = async () => {
    const res = await fetch(`${API_URL}/resagados`, { headers: getHeaders() });
    return res.json() as Promise<ApiResponse<ClienteResagado[]>>;
};

export const getResumenCartera = async () => {
    const res = await fetch(`${API_URL}/resumen-cartera`, { headers: getHeaders() });
    return res.json() as Promise<ApiResponse<ResumenCartera>>;
};

// ── Operaciones ────────────────────────────────────────────

export const configurarCredito = async (payload: ConfigurarCreditoPayload) => {
    const res = await fetch(`${API_URL}/configurar`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json() as Promise<ApiResponse<CreditoCliente>>;
};

export const registrarAbono = async (payload: AbonoPayload) => {
    const res = await fetch(`${API_URL}/abono`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json() as Promise<ApiResponse<{ id_movimiento: number; saldo_nuevo: number }>>;
};

export const liquidarDeuda = async (payload: LiquidarDeudaPayload) => {
    const res = await fetch(`${API_URL}/liquidar`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    return res.json() as Promise<ApiResponse<{ monto_liquidado: number }>>;
};
