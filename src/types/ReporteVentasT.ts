
export interface ReporteVentaDetallado {
    id_venta: number;
    fecha_venta: string;
    total_venta: number;
    metodo_pago: number;
    metodo_pago_descripcion: string;
    monto_recibido: number;
    cambio: number;
    estado_venta: number;
    estado_venta_descripcion: string;
    id_cliente: number | null;
    id_turno: number;
    id_usuario: number;
    nombre_usuario: string;
    email_usuario: string;
    nombre_sucursal: string;
    turno_fecha_apertura: string;
    turno_fecha_cierre: string | null;
    turno_estado: string;
    cantidad_productos: number;
}

export interface ReporteVentasResponse {
    success: boolean;
    message: string;
    ventas: ReporteVentaDetallado[];
}

