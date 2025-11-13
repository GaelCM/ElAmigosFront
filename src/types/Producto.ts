export type Producto = {
    id_producto: number;
    sku_pieza: string;
    nombre_producto: string;
    descripcion: string | null;
    precio_costo: number ;
    id_unidad_venta: number;
    nombre_presentacion: string;
    factor_conversion_cantidad: number;
    sku_presentacion: string;
    id_precio: number;
    precio_venta: number;
    id_sucursal: number;
    stock_piezas: number;
    stock_disponible_presentacion: number;
}

export interface ProductoItem {
    product: ProductoVenta;
    quantity: number;
}

export interface ProductoVenta{
    id_producto: number;
    sku_pieza: string;
    nombre_producto: string;
    descripcion: string | null;
    precio_costo: number;
    id_unidad_venta: number;
    nombre_presentacion: string;
    factor_conversion_cantidad: number;
    sku_presentacion: string;
    id_precio: number;
    precio_venta: number;
    id_sucursal: number;
    stock_piezas: number;
    stock_disponible_presentacion: number;
}

export type ProductoVentaResponse={
    success: boolean;
    message: string;
    data: ProductoVenta[];
}


// Tipo para el formulario de creación/edición de productos usado en el cliente
export interface PrecioPresentacion {
    id_precio?: number;
    id_sucursal?: number;
    id_unidad_venta?: number;
    precio_venta: number;
}

export interface PresentacionForm {
    nombre_presentacion: string;
    factor_conversion_cantidad: number;
    sku_presentacion?: string;
    precios: PrecioPresentacion[];
}

export interface ProductoForm {
    nombre_producto: string;
    descripcion?: string;
    id_categoria: number;
    precio_costo: number;
    sku_pieza?: string;
    presentaciones: PresentacionForm[];
    sucursales_seleccionadas: number[];
}