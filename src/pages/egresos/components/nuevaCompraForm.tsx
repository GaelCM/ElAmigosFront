
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowLeft, FileText, Wallet, UserCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { useListaCompras } from "@/contexts/listaCompras";
import { obtenerProveedoresApi } from "@/api/proveedoresApi/proveedoresApi";
import type { Proveedor } from "@/types/Proveedor";
import { ProductTable } from "@/components/productTable";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { NuevaCompra } from "@/types/ComprasT";
import { crearCompra } from "@/api/egresosApi/compras";

export default function NuevaCompraForm() {
    const navigate = useNavigate();
    const { user } = useCurrentUser();
    const {
        getCarritoActivo,
        addProduct,
        removeProduct,
        incrementQuantity,
        decrementQuantity,
        updateQuantity,
        updatePrice,
        getTotalCost,
        crearCarrito, clearCart
    } = useListaCompras();

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [idProveedor, setIdProveedor] = useState<string>("");
    const [folio, setFolio] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [metodoPago, setMetodoPago] = useState("0");
    const [montoTotalManual, setMontoTotalManual] = useState<string>("0");
    const [tempValues, setTempValues] = useState<Record<string, string>>({});

    const carrito = getCarritoActivo();
    const userRef = localStorage.getItem("openCaja");
    const openCaja = userRef ? JSON.parse(userRef) : null;

    useEffect(() => {
        if (!carrito) {
            crearCarrito("Nueva Compra");
        }
    }, [carrito, crearCarrito]);

    useEffect(() => {
        if (carrito) {
            const sum = getTotalCost();
            setMontoTotalManual(sum.toFixed(2));
        }
    }, [carrito?.productos?.length, carrito?.productos]);

    useEffect(() => {
        obtenerProveedoresApi().then((res) => {
            if (res.success) {
                setProveedores(res.data);
            }
        });
    }, []);

    const handleConfirmarCompra = async () => {
        if (!carrito || carrito.productos.length === 0) {
            toast.error("El carrito está vacío");
            return;
        }
        if (!idProveedor) {
            toast.error("Seleccione un proveedor");
            return;
        }

        const payload: NuevaCompra = {
            id_sucursal: user.id_sucursal,
            id_usuario: user.id_usuario,
            id_turno: openCaja.id_turno,
            id_proveedor: parseInt(idProveedor),
            monto: parseFloat(montoTotalManual),
            metodo_pago: parseInt(metodoPago),
            folio,
            descripcion,
            items: carrito.productos.map(item => ({
                id_producto: item.product.id_producto,
                id_unidad_venta: item.product.id_unidad_venta,
                cantidad: item.quantity,
                precio_unitario: item.precio_compra ?? item.product.precio_costo
            }))
        };

        const res = await crearCompra(payload)
        if (res.success) {
            clearCart();
            toast.success(res.message);
            navigate("/egresos");
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            {/* Header Limpio */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4 text-black">
                    <Button variant="default" size="icon" onClick={() => navigate("/egresos")} className="h-9 w-9 text-slate-400 hover:text-black hover:bg-slate-800">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Button>
                    <h1 className="text-sm font-black uppercase tracking-widest text-slate-800">Nueva Compra</h1>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* 2/3 - Catálogo (Buscador) */}
                <div className="w-full lg:w-2/3 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
                    <div className="flex-1 overflow-hidden p-2">
                        <div className="h-full rounded-xl overflow-hidden bg-white shadow-sm border border-slate-200">
                            <ProductTable
                                idSucursal={user.id_sucursal}
                                searchLocal={true}
                                onAddProduct={addProduct}
                                allowOutOfStock={true}
                            />
                        </div>
                    </div>
                </div>

                {/* 1/3 - Carrito y Datos (Lateral Estrecho) */}
                <div className="w-full lg:w-1/3 flex flex-col h-full overflow-hidden bg-slate-50/50">
                    {/* Sección Detalle de Orden */}
                    <div className="flex-1 flex flex-col overflow-hidden m-2 lg:m-3 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                        {/* Header de la lista con mejor distribución de espacio */}
                        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Orden</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Sugerido:</span>
                                <span className="text-sm font-black text-blue-600">${getTotalCost().toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Cabecera de Columnas: Optimizada para espacios estrechos */}
                        <div className="grid grid-cols-[1fr_75px_85px_30px] gap-1 px-3 py-2 bg-slate-50/80 text-[9px] font-black text-slate-500 uppercase border-b border-slate-100">
                            <span>Articulo</span>
                            <span className="text-center">Cant.</span>
                            <span className="text-right">Costo / Total</span>
                            <span></span>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="divide-y divide-slate-50">
                                {!carrito || carrito.productos.length === 0 ? (
                                    <div className="h-40 lg:h-64 flex flex-col items-center justify-center text-slate-300">
                                        <Package className="w-10 h-10 mb-2 opacity-20" />
                                        <p className="text-[10px] font-bold uppercase opacity-40">Vacío</p>
                                    </div>
                                ) : (
                                    carrito.productos.map((item) => (
                                        <div key={item.product.id_unidad_venta} className="grid grid-cols-[1fr_75px_85px_30px] gap-1 px-3 py-3 items-center hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                            {/* Nombre del Producto: Ahora tiene más espacio y puede usar min-w-0 */}
                                            <div className="min-w-0 pr-1 flex flex-col">
                                                <h4 className="font-bold text-[11px] text-slate-800 leading-tight uppercase line-clamp-2">
                                                    {item.product.nombre_producto}
                                                </h4>
                                                <span className="text-[8px] font-medium text-slate-400 mt-0.5">{item.product.sku_presentacion}</span>
                                            </div>

                                            {/* Cantidad: Control más esbelto con input manual */}
                                            <div className="flex justify-center">
                                                <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 h-6 w-[85px]">
                                                    <Button variant="ghost" size="icon" className="h-5 w-4 shrink-0 rounded-sm hover:bg-slate-100" onClick={() => decrementQuantity(item.product.id_unidad_venta)}>
                                                        <Minus className="w-2.5 h-2.5" />
                                                    </Button>
                                                    <input
                                                        type="number"
                                                        className="w-full text-center font-bold text-[10px] bg-transparent border-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        value={tempValues[`qty-${item.product.id_unidad_venta}`] ?? (item.quantity === 0 ? "" : item.quantity)}
                                                        onFocus={(e) => {
                                                            e.target.select();
                                                            setTempValues(prev => ({ ...prev, [`qty-${item.product.id_unidad_venta}`]: item.quantity.toString() }));
                                                        }}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setTempValues(prev => ({ ...prev, [`qty-${item.product.id_unidad_venta}`]: val }));
                                                            const num = parseFloat(val);
                                                            if (!isNaN(num)) updateQuantity(item.product.id_unidad_venta, num);
                                                            else if (val === "") updateQuantity(item.product.id_unidad_venta, 0);
                                                        }}
                                                        onBlur={() => {
                                                            setTempValues(prev => {
                                                                const n = { ...prev };
                                                                delete n[`qty-${item.product.id_unidad_venta}`];
                                                                return n;
                                                            });
                                                        }}
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-5 w-4 shrink-0 rounded-sm hover:bg-slate-100" onClick={() => incrementQuantity(item.product.id_unidad_venta)}>
                                                        <Plus className="w-2.5 h-2.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Precio y Total: Apilados para ahorrar ancho */}
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center relative">
                                                    <span className="text-[8px] text-blue-400 font-bold mr-0.5">$</span>
                                                    <input
                                                        type="number"
                                                        value={tempValues[`prc-${item.product.id_unidad_venta}`] ?? ((item.precio_compra ?? item.product.precio_costo) || "")}
                                                        onFocus={(e) => {
                                                            e.target.select();
                                                            setTempValues(prev => ({ ...prev, [`prc-${item.product.id_unidad_venta}`]: (item.precio_compra ?? item.product.precio_costo).toString() }));
                                                        }}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setTempValues(prev => ({ ...prev, [`prc-${item.product.id_unidad_venta}`]: val }));
                                                            const num = parseFloat(val);
                                                            if (!isNaN(num)) updatePrice(item.product.id_unidad_venta, num);
                                                            else if (val === "") updatePrice(item.product.id_unidad_venta, 0);
                                                        }}
                                                        onBlur={() => {
                                                            setTempValues(prev => {
                                                                const n = { ...prev };
                                                                delete n[`prc-${item.product.id_unidad_venta}`];
                                                                return n;
                                                            });
                                                        }}
                                                        className="h-4 w-full p-0 font-black text-[11px] text-blue-600 bg-transparent border-none text-right focus:ring-0"
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 mt-0.5 tabular-nums">
                                                    ${((item.precio_compra ?? item.product.precio_costo) * item.quantity).toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Eliminar */}
                                            <div className="flex justify-end">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => removeProduct(item.product.id_unidad_venta)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Datos del Egreso y Total Final */}
                    <div className="px-3 pb-3 space-y-3 shrink-0">
                        {/* Panel de Datos con Labels Legibles */}
                        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <UserCircle className="w-3.5 h-3.5 text-blue-600" />
                                    <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Proveedor</Label>
                                </div>
                                <Select value={idProveedor} onValueChange={setIdProveedor}>
                                    <SelectTrigger className="h-9 text-xs font-bold border-slate-200">
                                        <SelectValue placeholder="Seleccionar proveedor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {proveedores.map(p => (
                                            <SelectItem key={p.id_proveedor} value={p.id_proveedor.toString()} className="text-xs">
                                                {p.nombre_proveedor}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                        <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Folio</Label>
                                    </div>
                                    <Input
                                        placeholder="TKT-000"
                                        className="h-9 text-xs font-bold border-slate-200"
                                        value={folio}
                                        onChange={(e) => setFolio(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                                        <Label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Pago</Label>
                                    </div>
                                    <Select value={metodoPago} onValueChange={setMetodoPago}>
                                        <SelectTrigger className="h-9 text-xs font-bold border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0" className="text-xs">Efectivo</SelectItem>
                                            <SelectItem value="1" className="text-xs">Tarjeta</SelectItem>
                                            <SelectItem value="2" className="text-xs">Transferencia</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Panel de Monto Final: Claro y Visual */}
                        <div className="bg-blue-600 rounded-xl p-4 shadow-md text-white">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2 block">Monto Final Ticket</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-light opacity-60">$</span>
                                <input
                                    type="number"
                                    className="bg-transparent border-none text-4xl lg:text-5xl font-black text-white w-full focus:ring-0 p-0 outline-none tabular-nums"
                                    value={montoTotalManual === "0" ? "" : montoTotalManual}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => setMontoTotalManual(e.target.value === "" ? "0" : e.target.value)}
                                    step="0.01"
                                />
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold uppercase opacity-60">Sugerido</span>
                                    <span className="text-sm font-black text-white/90">${getTotalCost().toFixed(2)}</span>
                                </div>
                                <Button
                                    onClick={handleConfirmarCompra}
                                    className="bg-white text-blue-700 hover:bg-blue-50 font-black uppercase tracking-widest text-[10px] px-6 h-10 shadow-lg"
                                >
                                    Confirmar Registro
                                </Button>
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="bg-white rounded-xl px-4 py-2 border border-slate-200 shadow-sm">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notas / Observaciones</Label>
                            <Input
                                placeholder="Comentario adicional..."
                                className="bg-transparent border-none h-6 text-xs text-slate-600 p-0 focus-visible:ring-0 shadow-none mt-0"
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
