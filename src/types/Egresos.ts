
export interface GastoPayload {
    id_sucursal: number;
    id_turno: number;
    id_usuario: number;
    monto: number;
    metodo_pago: number;
    folio: string;
    descripcion: string;
    fecha_gasto: string;
}
export interface CompraPayload {
    id_sucursal: number;
    id_turno?: number;
    id_usuario: number;
    monto: number;
    metodo_pago: number;
    id_proveedor: number;
    folio: string;
    descripcion: string;
    fecha_compra?: string;
}
export interface MovimientoPayload {
    id_sucursal: number;
    id_turno?: number;
    id_usuario: number;
    tipo_movimiento: number; // 0 para retiro y 1 para deposito
    monto: number;
    concepto: string;
    fecha_movimiento?: string;
}

export type Compra = {
    id_compra: number;           // SERIAL PRIMARY KEY
    id_sucursal: number;         // INTEGER NOT NULL
    id_turno: number | null;     // INTEGER (puede ser null)
    id_usuario: number;          // INTEGER NOT NULL
    monto: number;               // NUMERIC(10,2) NOT NULL
    metodo_pago: number;         // INTEGER NOT NULL (1=efectivo, 2=tarjeta)
    id_proveedor: number;
    folio: string | null;
    descripcion: string | null;
    fecha_compra: string;
}

export type Gasto = {
    id_gasto: number;            // SERIAL PRIMARY KEY
    id_sucursal: number;         // INTEGER NOT NULL
    id_turno: number | null;     // INTEGER (puede ser null)
    id_usuario: number;          // INTEGER NOT NULL
    monto: number;               // NUMERIC(10,2) NOT NULL
    metodo_pago: number;         // INTEGER NOT NULL (0=efectivo, 1=tarjeta)
    folio: string | null;        // VARCHAR(50)
    descripcion: string | null;  // TEXT
    fecha_gasto: string;         // VARCHAR(50) DEFAULT CURRENT_TIMESTAMP
}

export type MovimientoEfectivo = {
    id_movimiento: number;       // SERIAL PRIMARY KEY
    id_sucursal: number;         // INTEGER NOT NULL
    id_turno: number | null;     // INTEGER (puede ser null)
    id_usuario: number;          // INTEGER NOT NULL
    tipo_movimiento: number;     // INTEGER NOT NULL (0=retiro, 1=deposito)
    monto: number;               // NUMERIC(10,2) NOT NULL
    concepto: string | null;
    fecha_movimiento: string;    // VARCHAR(50) DEFAULT CURRENT_TIMESTAMP
}


export interface CompraUpdateInput extends CompraPayload {
    id_compra: number;
}

export interface GastoUpdateInput extends GastoPayload {
    id_gasto: number;
}

export interface MovimientoEfectivoUpdateInput extends MovimientoPayload {
    id_movimiento: number;
}


export interface ReporteEgresoItem {
    id: number;
    tipo_registro: 'Compra' | 'Gasto' | 'Retiro' | 'Deposito';
    monto: number;
    fecha: string;
    descripcion: string | null;
    folio: string | null;
    metodo_pago: number | null;
    metodo_pago_descripcion: string | null;
    id_sucursal: number;
    nombre_sucursal: string;
    id_usuario: number;
    nombre_usuario: string;
}
