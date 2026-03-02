import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Search, FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { useListaCompras } from "@/contexts/listaCompras";
import { obtenerProveedoresApi } from "@/api/proveedoresApi/proveedoresApi";
import { getProductos } from "@/api/productosApi/productosApi";
import type { Proveedor } from "@/types/Proveedor";
import type { ProductoVenta } from "@/types/Producto";
import { toast } from "sonner";
import type { NuevaCompra } from "@/types/ComprasT";
import { crearCompra } from "@/api/egresosApi/compras";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

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

    const [productosLista, setProductosLista] = useState<ProductoVenta[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const carrito = getCarritoActivo();
    const userRef = localStorage.getItem("openCaja");
    const openCaja = userRef ? JSON.parse(userRef) : null;

    useEffect(() => {
        if (!carrito) crearCarrito("Nueva Compra");
        setLoading(true);
        Promise.all([
            obtenerProveedoresApi(),
            getProductos(user.id_sucursal)
        ]).then(([provRes, prodRes]) => {
            if (provRes.success) setProveedores(provRes.data);
            if (prodRes.success) setProductosLista(prodRes.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user.id_sucursal]);

    useEffect(() => {
        if (carrito) {
            setMontoTotalManual(getTotalCost().toFixed(2));
        }
    }, [carrito?.productos?.length, carrito?.productos, getTotalCost]);

    const productosFiltrados = useMemo(() => {
        const s = searchTerm.toLowerCase();
        return productosLista.filter(p =>
            p.nombre_producto.toLowerCase().includes(s) ||
            p.sku_pieza?.toLowerCase().includes(s)
        );
    }, [productosLista, searchTerm]);

    useEffect(() => { setSelectedIndex(0); }, [searchTerm]);

    // Navigation logic
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isInput = document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA';
            const isSearchInput = document.activeElement === searchInputRef.current;
            if (isInput && !isSearchInput) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev < productosFiltrados.length - 1 ? prev + 1 : 0));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : productosFiltrados.length - 1));
            } else if (e.key === "Enter") {
                if (productosFiltrados[selectedIndex]) {
                    e.preventDefault();
                    addProduct(productosFiltrados[selectedIndex]);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [productosFiltrados, selectedIndex, addProduct]);

    useEffect(() => {
        const el = document.querySelector(`[data-prod-index="${selectedIndex}"]`);
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [selectedIndex]);

    const handleConfirmarCompra = async () => {
        if (!carrito || carrito.productos.length === 0) return toast.error("El carrito está vacío");
        if (!idProveedor) return toast.error("Seleccione un proveedor");
        const payload: NuevaCompra = {
            id_sucursal: user.id_sucursal, id_usuario: user.id_usuario, id_turno: openCaja?.id_turno,
            id_proveedor: parseInt(idProveedor), monto: parseFloat(montoTotalManual), metodo_pago: parseInt(metodoPago),
            folio, descripcion, items: carrito.productos.map(item => ({
                id_producto: item.product.id_producto, id_unidad_venta: item.product.id_unidad_venta,
                cantidad: item.quantity, precio_unitario: item.precio_compra ?? item.product.precio_costo
            }))
        };
        const res = await crearCompra(payload);
        if (res.success) { clearCart(); toast.success(res.message); navigate("/egresos"); }
        else toast.error(res.message);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden font-bold">
            {/* Header */}
            <header className="bg-white border-b px-6 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/egresos")} className="h-8 w-8">
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                    </Button>
                    <div className="leading-none">
                        <h1 className="text-lg font-black text-slate-900 uppercase">Registrar Compra</h1>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Inventario & Egresos</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[8px] text-slate-400 font-black uppercase">Turno</p>
                        <p className="text-sm font-black text-blue-600">#{openCaja?.id_turno || "---"}</p>
                    </div>
                    <div className="text-right border-l pl-4">
                        <p className="text-[8px] text-slate-400 font-black uppercase">Sugerido</p>
                        <p className="text-xl font-black text-slate-900 leading-none">${getTotalCost().toFixed(2)}</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden min-h-0">
                <Card className="lg:flex-[2] flex flex-col min-h-0 overflow-hidden bg-white shadow-sm border-slate-200">
                    <div className="p-3 border-b bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 h-8 text-xs font-bold border-2"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <Table>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-10 opacity-50">
                                            Cargando catálogo...
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    productosFiltrados.map((p, idx) => (
                                        <TableRow
                                            key={p.id_unidad_venta} data-prod-index={idx}
                                            className={`cursor-pointer h-12 ${idx === selectedIndex ? 'bg-blue-300' : 'hover:bg-slate-50'}`}
                                            onClick={() => addProduct(p)}
                                        >
                                            <TableCell className="py-1 px-3">
                                                <p className="text-[10px] font-black uppercase leading-tight line-clamp-1">{p.nombre_producto}</p>
                                                <div className="flex gap-1 items-center mt-0.5">
                                                    <span className="text-[8px] text-slate-400">{p.sku_pieza}</span>
                                                    <Badge className="text-[7px] h-3 px-1 leading-none uppercase">{p.nombre_presentacion}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-1 px-3 text-right font-black text-[10px] text-slate-600">
                                                ${p.precio_venta.toFixed(1)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Card className="lg:flex-[3] flex flex-col min-h-0 overflow-hidden bg-white shadow-md border-2 border-slate-200">
                    <div className="p-3 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                            <h2 className="text-[10px] font-black uppercase">Orden de Compra</h2>
                        </div>
                        <Badge className="bg-blue-600 text-[9px] font-black">{carrito?.productos?.length || 0} ITEMS</Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50/20 p-3 space-y-2">
                        {carrito?.productos?.map((item) => (
                            <div key={item.product.id_unidad_venta} className="bg-white border rounded-lg p-2 shadow-sm flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black uppercase truncate">{item.product.nombre_producto}</p>
                                    <Badge variant="outline" className="text-[8px] font-black border-slate-300 h-3 leading-none">{item.product.nombre_presentacion}</Badge>
                                </div>
                                <div className="flex items-center bg-slate-100 border rounded h-7 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-6 w-5" onClick={() => decrementQuantity(item.product.id_unidad_venta)}><Minus className="w-2.5 h-2.5" /></Button>
                                    <input
                                        type="number" className="w-8 text-center font-black text-[10px] bg-transparent border-none p-0 focus:ring-0"
                                        value={tempValues[`qty-${item.product.id_unidad_venta}`] ?? item.quantity}
                                        onChange={(e) => {
                                            const val = e.target.value; setTempValues(prev => ({ ...prev, [`qty-${item.product.id_unidad_venta}`]: val }));
                                            const n = parseFloat(val); if (!isNaN(n)) updateQuantity(item.product.id_unidad_venta, n);
                                        }}
                                        onBlur={() => setTempValues(prev => { const n = { ...prev }; delete n[`qty-${item.product.id_unidad_venta}`]; return n; })}
                                    />
                                    <Button variant="ghost" size="icon" className="h-6 w-5" onClick={() => incrementQuantity(item.product.id_unidad_venta)}><Plus className="w-2.5 h-2.5" /></Button>
                                </div>
                                <div className="w-[85px] shrink-0 text-right">
                                    <div className="flex items-center bg-blue-50 border border-blue-100 rounded px-1 h-5">
                                        <span className="text-[9px] text-blue-500 font-black">$</span>
                                        <input
                                            type="number"
                                            className="w-full text-right bg-transparent border-none p-0 focus:ring-0 text-[10px] font-black text-blue-700"
                                            value={tempValues[`prc-${item.product.id_unidad_venta}`] ?? (item.precio_compra ?? item.product.precio_costo)}
                                            onChange={(e) => {
                                                const val = e.target.value; setTempValues(prev => ({ ...prev, [`prc-${item.product.id_unidad_venta}`]: val }));
                                                const n = parseFloat(val); if (!isNaN(n)) updatePrice(item.product.id_unidad_venta, n);
                                            }}
                                            onBlur={() => setTempValues(prev => { const n = { ...prev }; delete n[`prc-${item.product.id_unidad_venta}`]; return n; })}
                                        />
                                    </div>
                                    <p className="text-[9px] font-black mt-0.5 pr-1">${((item.precio_compra ?? item.product.precio_costo ?? 0) * item.quantity).toFixed(2)}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => removeProduct(item.product.id_unidad_venta)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white border-t space-y-3 shrink-0">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-0.5">
                                <Label className="text-[8px] font-black uppercase text-slate-500">Proveedor</Label>
                                <Select value={idProveedor} onValueChange={setIdProveedor}>
                                    <SelectTrigger className="h-8 text-[10px] font-black border-2"><SelectValue placeholder="..." /></SelectTrigger>
                                    <SelectContent>
                                        {proveedores.map(p => <SelectItem key={p.id_proveedor} value={p.id_proveedor.toString()} className="text-[10px]">{p.nombre_proveedor}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[8px] font-black uppercase text-slate-500">Folio</Label>
                                <Input value={folio} onChange={e => setFolio(e.target.value)} className="h-8 text-[10px] font-black border-2" />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[8px] font-black uppercase text-slate-500">Pago</Label>
                                <Select value={metodoPago} onValueChange={setMetodoPago}>
                                    <SelectTrigger className="h-8 text-[10px] font-black border-2"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0" className="text-[10px]">Efectivo</SelectItem>
                                        <SelectItem value="1" className="text-[10px]">Tarjeta</SelectItem>
                                        <SelectItem value="2" className="text-[10px]">Transf.</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center text-white border-l-4 border-blue-500">
                            <div>
                                <Label className="text-[8px] font-black opacity-50 uppercase tracking-widest block leading-none mb-1">Total Compra</Label>
                                <div className="flex items-center gap-1 leading-none">
                                    <span className="text-sm font-light text-blue-400">$</span>
                                    <input
                                        type="number" className="bg-transparent border-none text-2xl font-black text-white w-full focus:ring-0 p-0 outline-none tabular-nums"
                                        value={montoTotalManual} onChange={e => setMontoTotalManual(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleConfirmarCompra} className="bg-blue-600 hover:bg-blue-700 h-10 px-6 text-[10px] font-black uppercase tracking-widest">Confirmar</Button>
                        </div>
                        <div className="flex items-center gap-2 border-t pt-2 opacity-60">
                            <FileText className="w-3 h-3" />
                            <Input placeholder="Notas..." className="bg-transparent border-none h-4 text-[9px] p-0 focus:ring-0 italic" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
