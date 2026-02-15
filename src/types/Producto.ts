export type Producto = {
    id_producto: number;
    sku_pieza: string;
    nombre_producto: string;
    descripcion: string | null;
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

export interface ProductoItem {
    product: ProductoVenta;
    quantity: number;
    usarPrecioMayoreo: boolean;
    precio_compra?: number;
}

export interface ProductoVenta {
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
    es_granel: boolean;
}

export type ProductoVentaResponse = {
    success: boolean;
    message: string;
    data: ProductoVenta[];
}


export interface ProductoFormFinal {
    nombre_producto: string;
    descripcion?: string | undefined;
    id_categoria: string;
    precio_costo: number;
    sku_pieza?: string | undefined;
    es_granel: boolean;
    cantidad_actual: number;
    cantidad_minima: number;
    sucursales_inventario: {
        id_sucursal: number;
        cantidad_actual: number;
        cantidad_minima: number;
    }[];
    variantes: {
        id_unidad_venta?: number;
        nombre_presentacion: string;
        factor_conversion_cantidad: number;
        sku_presentacion?: string | undefined;
        sucursales_venta: {
            id_sucursal: number;
            precio_venta: number;
            precio_mayoreo: number;
        }[];
    }[];
}

export type ProductoGeneralResponse = {
    success: boolean;
    message: string;
    data: ProductoFormFinal;
}


type ComponenteProductoEspecial = {
    id_unidad_venta: number;
    nombre_producto: string;
    nombre_presentacion: string;
    cantidad: number;
    precio_unitario: number;
};

export type ProductoEspecialInput = {
    sku_pieza: string;
    nombre_producto: string;
    descripcion?: string | undefined;
    id_categoria: string | number;  // Puede venir como string del form
    precio_venta: number;
    precio_mayoreo: number;
    isEspecial: number;  // 1 para especial, 0 para normal
    componentes: ComponenteProductoEspecial[];
};

export type ProductoGeneralEspResponse = {
    success: boolean;
    message: string;
    data: ProductoEspecialInput;
}

