
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


export interface VentaMensual {
    mes_anio: string;
    mes_nombre: string;
    sucursal: string;
    id_sucursal: number;
    total_ventas: number;
    monto_total: number;
    ticket_promedio: number;
    venta_minima: number;
    venta_maxima: number;
    ventas_efectivo_count: number;
    monto_efectivo: number;
    ventas_tarjeta_count: number;
    monto_tarjeta: number;
    ventas_transferencia_count: number;
    monto_transferencia: number;
}


export interface ReporteVentasMensualesResponse {
    success: boolean;
    message: string;
    data: VentaMensual[];
}

export interface DetalleVentaItem {
    id_detalle_venta: number;
    id_venta: number;
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    precio_mayoreo: boolean;
    tipo_precio: string;
    subtotal: number;
    id_unidad_venta: number;
    nombre_unidad: string;
    id_producto: number;
    nombre_categoria: string;
    fecha_venta: string;
    total_venta: number;
    monto_recibido: number;
    cambio: number;
    metodo_pago: number;
    estado_venta: number;
    nombre_usuario: string;
    nombre_sucursal: string;
    id_cliente: number | string | null;
    metodo_pago_descripcion: string;
}


export interface DetalleVentaResponse {
    success: boolean;
    message: string;
    data: DetalleVentaItem[];
}
