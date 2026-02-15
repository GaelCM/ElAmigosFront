
export type nuevoCorte = {
    id_usuario: number;
    id_sucursal: number;
    efectivo_inicial: number;
    observaciones_apertura: string;
}

export type nuevoCorteResponse = {
    success: boolean;
    message: string;
    data: { id_turno: number, fecha_apertura: string };
}

export interface CerrarCorteBody {
    id_turno: number;
    id_usuario_cierre: number;
    efectivo_contado?: number;
    observaciones_cierre?: string;
}

export interface ResumenCorte {
    ventas: {
        total: number;
        efectivo: number;
        tarjeta: number;
        numero: number;
    };
    egresos: {
        compras: number;
        compras_efectivo: number;
        gastos: number;
        gastos_efectivo: number;
        total: number;
        total_efectivo: number;
    };
    movimientos: {
        retiros: number;
        depositos: number;
        total_movimientos: number;
    };
    efectivo: {
        inicial: number;
        esperado: number;
        contado: number | null;
        diferencia: number;
    };
}

export interface CerrarCorteResponse {
    turno: any;
    resumen: ResumenCorte;
}
