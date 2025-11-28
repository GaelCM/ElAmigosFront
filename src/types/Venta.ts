

export type EstadoVenta="Inicio" | "Cargando" | "Listo" | "Error";


interface CarritoItem {
  product: {
    id_producto: number;
    id_precio: number;
    id_unidad_venta: number;
    id_sucursal: number;
    nombre_producto: string;
    descripcion: string;
    precio_venta: number;
    precio_mayoreo: number;
    sku_pieza: string;
  };
  quantity: number;
}

export interface CarritoPayload {
  id_usuario: number;
  usuario: string;
  id_sucursal: number;
  id_cliente: string;
  metodo_pago: number;
  monto_recibido: number;
  productos: CarritoItem[];
}