// ─────────────────────────────────────────────────────────
//  TIPOS - MÓDULO CRÉDITOS A CLIENTES
// ─────────────────────────────────────────────────────────

export type TipoMovimientoCredito = 'cargo' | 'abono' | 'liquidacion';

export interface CreditoCliente {
    id_credito: number;
    id_cliente: number;
    nombre_cliente?: string;
    limite_credito: number;   // 0 = sin límite
    saldo_actual: number;
    fecha_creacion: string;
    activo: boolean;
}

/** Retornado por GET /api/creditos/todos — incluye datos de pago */
export interface CreditoClienteCompleto extends CreditoCliente {
    nombre_cliente: string;
    telefono?: string | null;
    ultima_fecha_pago: string | null;
    primer_cargo: string | null;
    total_movimientos: number;
}


export interface MovimientoCredito {
    id_movimiento: number;
    id_cliente: number;
    tipo_movimiento: TipoMovimientoCredito;
    monto: number;
    saldo_anterior: number;
    saldo_nuevo: number;
    id_venta?: number | null;
    id_usuario?: number | null;
    nombre_usuario?: string | null;
    id_sucursal?: number | null;
    concepto?: string | null;
    fecha_movimiento: string;
}

// ── Payloads de entrada ──

export interface ConfigurarCreditoPayload {
    id_cliente: number;
    limite_credito: number; // 0 = sin límite
}

export interface AbonoPayload {
    id_cliente: number;
    monto: number;
    id_usuario: number;
    id_sucursal: number;
    concepto?: string;
}

export interface CargaVentaPayload {
    id_cliente: number;
    monto: number;
    id_venta: number;
    id_usuario: number;
    id_sucursal: number;
}

export interface LiquidarDeudaPayload {
    id_cliente: number;
    id_usuario: number;
    id_sucursal: number;
}

// ── Respuestas ──

export interface ClienteResagado {
    id_cliente: number;
    nombre_cliente: string;
    saldo_actual: number;
    limite_credito: number;
    ultima_fecha_pago: string | null;
    deuda_mas_antigua: string | null;
    dias_sin_pago?: number;
}

export interface ResumenCartera {
    total_clientes_con_deuda: number;
    total_deuda_cartera: number;
}
