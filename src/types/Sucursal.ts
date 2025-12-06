export interface Sucursal {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  telefono: string;
  total_productos: number;
  total_presentaciones: number;
  stock_total_piezas: number;
  valor_inventario_costo: number;
  valor_inventario_venta: number;
  productos_stock_bajo: number;
  productos_sin_stock: number;
}

export type SucursalResponse = {
  success: boolean;
  message: string;
  data: Sucursal[];
}



export interface SucursalDTO {
  id_sucursal?: number;
  nombre: string;
  direccion: string;
  telefono: string;
}


export interface SucursalOutput {
  id_sucursal: number;
  nombre: string;
  direccion: string;
  telefono: string;
}
