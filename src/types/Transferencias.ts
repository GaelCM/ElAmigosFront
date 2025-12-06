

export interface TransferenciaProducto {
    id_producto: number;
    sku_pieza: string;
    nombre_producto: string;
    descripcion: string;
    precio_costo: number;
    es_producto_compuesto: number;
    id_unidad_venta: number;
    nombre_presentacion: string;
    factor_conversion_cantidad: number;
    sku_presentacion: string;
    id_precio: number;
    precio_venta: number;
    precio_mayoreo: number;
    id_sucursal: number;
    stock_piezas: number;
    stock_disponible_presentacion: number;
}

export interface TransferenciaItem {
    product: TransferenciaProducto;
    quantity: number;
}


//es type de entrada de la api al crear una transferencia
export interface NuevaTransferenciaDTO {
    id_sucursal_origen: number;
    id_sucursal_destino: number;
    id_usuario_origen: number;
    fecha_creacion: string;
    estado: string;
    motivo: string;
    productos: ProductoTransferencia[];
}

export interface ProductoTransferencia {
    id_producto: number;
    id_unidad_venta: number;
    cantidad: number;
}



//es type de salida de la api al crear una transferencia
export interface TransferenciaDTO {
    id_transferencia: number;
    estado: string;
    fecha_creacion: string;
    fecha_envio: string
    fecha_recepcion: string | null;
    fecha_autorizacion: string | null;
    motivo: string

    id_sucursal_origen: number;
    sucursal_origen: string;

    id_sucursal_destino: number;
    sucursal_destino: string;

    usuario_origen: string;
    usuario_autoriza: string | null;
    usuario_recibe: string | null;

    total_productos: number;
    total_piezas: number;
}



//es type de salida para la api para ver el detalle de una transferencia
export interface DetalleTransferenciaDTO {
    id_transferencia: number;
    estado: string;
    fecha_creacion: string;
    fecha_envio: string;
    fecha_recepcion: string | null;
    fecha_autorizacion: string | null;
    motivo: string;

    id_sucursal_origen: number;
    sucursal_origen: string;
    id_sucursal_destino: number;
    sucursal_destino: string;

    usuario_origen: string;
    usuario_autoriza: string | null;
    usuario_recibe: string | null;

    productos: ProductoDetalleDTO[];
}

interface ProductoDetalleDTO {
    id_detalle_transferencia: number;
    id_producto: number;
    nombre_producto: string;
    sku_pieza: string;
    id_unidad_venta: number;
    nombre_presentacion: string;
    factor_conversion_cantidad: number;
    cantidad_enviada: number;
    cantidad_recibida: number;
}




//se usa para recibir y autoriza una transferencia, es type de entrada para la api al recibir una transferencia 
export interface RecibirTransferenciaDTO {
    id_usuario: number;
    aceptar: boolean;  // true = acepta todo, false = rechaza
    productos_recibidos?: Array<{
        id_producto: number;
        cantidad_recibida: number;  // Solo si hay mermas
    }>;
}