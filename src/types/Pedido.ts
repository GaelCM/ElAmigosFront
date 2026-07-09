export type EstadoPedido = 0 | 1 | 2 | 3;

export const ESTADOS_PEDIDO: Record<EstadoPedido, { label: string; color: string }> = {
    0: { label: "Pendiente",  color: "bg-amber-100 text-amber-700 border-amber-200" },
    1: { label: "Preparado",  color: "bg-blue-100 text-blue-700 border-blue-200" },
    2: { label: "Completado", color: "bg-green-100 text-green-700 border-green-200" },
    3: { label: "Cancelado",  color: "bg-red-100 text-red-700 border-red-200" },
};

export type DetallePedido = {
    id_detalle_pedido: number;
    id_pedido:         number;
    id_unidad_venta:   number | null;
    nombre_producto:   string;
    nombre_presentacion?: string;
    cantidad:          number;
    precio_unitario:   number;
    precio_mayoreo:    boolean;
    subtotal:          number;
    sku_pieza:         string | null;
};

export type Pedido = {
    id_pedido:         number;
    id_usuario:        number;
    id_sucursal:       number;
    id_cliente:        number | null;
    nombre_cliente?:   string | null;
    total_pedido:      number;
    id_estado_pedido:  EstadoPedido;
    nombre_estado:     string;
    fecha_pedido:      string;
    notas:             string | null;
    detalle:           DetallePedido[];
};

// Payload para crear pedido (preventa)
export type CrearPedidoPayload = {
    id_usuario:   number;
    id_sucursal:  number;
    id_cliente?:  number | null;
    notas?:       string | null;
    productos: {
        id_unidad_venta:  number | null;
        id_producto:      number;
        nombre_producto:  string;
        cantidad:         number;
        precio_unitario:  number;
        precio_mayoreo:   boolean;
        sku_pieza?:       string;
    }[];
};

// Payload para completar pedido (cobrar)
export type CompletarPedidoPayload = {
    id_usuario:     number;
    id_turno:       number;
    metodo_pago:    number;
    monto_recibido: number;
};
