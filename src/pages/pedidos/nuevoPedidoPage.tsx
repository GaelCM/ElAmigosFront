import { crearPedidoApi, obtenerPedidoApi, editarPedidoApi } from "@/api/pedidosApi/pedidoApi";
import { getProductos } from "@/api/productosApi/productosApi";
import { getClientes } from "@/api/clientesApi/clientesApi";
import type { Cliente } from "@/types/Cliente";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/contexts/currentUser";
import { useListaProductosPedidos } from "@/contexts/listaPedidos";
import type { ProductoVenta } from "@/types/Producto";
import {
    ArrowLeft,
    FileCheck,
    Minus,
    Package,
    Plus,
    Search,
    ShoppingBag,
    Trash2,
    UserRound,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function NuevoPedidoPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const { user } = useCurrentUser();

    // ── Infinite scroll ───────────────────────────────────────
    const BATCH_SIZE = 30;
    const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const clienteDropdownRef = useRef<HTMLDivElement>(null);

    const {
        getCarritoActivo,
        crearCarrito,
        carritoActivo,
        addProduct,
        removeProduct,
        incrementQuantity,
        decrementQuantity,
        clearCart,
    } = useListaProductosPedidos();

    const carritoData = getCarritoActivo();
    const productosEnCarrito = carritoData?.productos ?? [];

    const [productos, setProductos] = useState<ProductoVenta[]>([]);
    const [loadingProductos, setLoadingProductos] = useState(false);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [selectedCliente, setSelectedCliente] = useState<string>("none");
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [clienteDropdownAbierto, setClienteDropdownAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [notas, setNotas] = useState("");
    const [carritoAbierto, setCarritoAbierto] = useState(false);
    const [datosCargados, setDatosCargados] = useState(false);

    // ── Clientes filtrados + renderizado parcial (max 50) ─────
    const MAX_CLIENTES_VISIBLES = 50;
    const clientesFiltrados = useMemo(() => {
        const q = busquedaCliente.toLowerCase().trim();
        if (!q) return clientes;
        return clientes.filter(
            (c) =>
                c.nombre_cliente?.toLowerCase().includes(q) ||
                c.telefono?.toLowerCase().includes(q)
        );
    }, [clientes, busquedaCliente]);
    const clientesVisibles = clientesFiltrados.slice(0, MAX_CLIENTES_VISIBLES);
    const hayMasClientes = clientesFiltrados.length > MAX_CLIENTES_VISIBLES;

    const clienteSeleccionado = clientes.find(c => String(c.id_cliente) === selectedCliente) ?? null;

    // Cerrar dropdown de cliente al click fuera
    useEffect(() => {
        if (!clienteDropdownAbierto) return;
        const handler = (e: MouseEvent) => {
            if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(e.target as Node)) {
                setClienteDropdownAbierto(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [clienteDropdownAbierto]);

    // Reset del contador cuando cambia la búsqueda
    useEffect(() => {
        setDisplayedCount(BATCH_SIZE);
    }, [busqueda]);

    useEffect(() => {
        if (!carritoActivo && !isEditing) crearCarrito("Nuevo Pedido");
    }, [carritoActivo, crearCarrito, isEditing]);

    const cargarDatos = useCallback(async () => {
        setLoadingProductos(true);
        try {
            const [resProd, resCli] = await Promise.all([
                getProductos(user.id_sucursal),
                getClientes()
            ]);
            
            let loadedProducts: ProductoVenta[] = [];
            if (resProd.success) {
                setProductos(resProd.data);
                loadedProducts = resProd.data;
            }
            if (resCli.success) setClientes(resCli.data);

            if (isEditing && id) {
                const resPedido = await obtenerPedidoApi(Number(id));
                if (resPedido.success && resPedido.data) {
                    const p = resPedido.data;
                    setNotas(p.notas || "");
                    if (p.id_cliente) setSelectedCliente(String(p.id_cliente));
                    
                    crearCarrito(`Pedido #${id}`);
                    clearCart();
                    
                    if (p.detalle) {
                        p.detalle.forEach(d => {
                            const prod = loadedProducts.find(lp => lp.id_unidad_venta === d.id_unidad_venta);
                            if (prod) {
                                for(let i=0; i<d.cantidad; i++) {
                                    addProduct(prod);
                                }
                            }
                        });
                    }
                } else {
                    toast.error("No se pudo cargar el pedido.");
                }
            }
            setDatosCargados(true);
        } catch {
            toast.error("Error al cargar datos.");
        } finally {
            setLoadingProductos(false);
        }
    }, [user.id_sucursal, isEditing, id, crearCarrito, clearCart, addProduct]);

    useEffect(() => {
        if (!datosCargados) {
            cargarDatos();
        }
    }, [cargarDatos, datosCargados]);

    const productosFiltrados = useMemo(() => {
        const q = busqueda.toLowerCase().trim();
        if (!q) return productos;
        return productos.filter(
            (p) =>
                p.nombre_producto.toLowerCase().includes(q) ||
                p.sku_pieza?.toLowerCase().includes(q) ||
                p.sku_presentacion?.toLowerCase().includes(q)
        );
    }, [productos, busqueda]);

    const productosPaginados = useMemo(() => {
        if (busqueda.trim()) return productosFiltrados;
        return productosFiltrados.slice(0, displayedCount);
    }, [productosFiltrados, displayedCount, busqueda]);

    const hayMas = !busqueda.trim() && displayedCount < productosFiltrados.length;

    useEffect(() => {
        if (!sentinelRef.current || !hayMas) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setDisplayedCount((prev) => prev + BATCH_SIZE);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hayMas, productosPaginados.length]);

    const cantidadEnCarrito = (id_unidad_venta: number) =>
        productosEnCarrito.find((i) => i.product.id_unidad_venta === id_unidad_venta)?.quantity ?? 0;

    const totalItems = productosEnCarrito.reduce((s, i) => s + i.quantity, 0);
    const totalPedido = productosEnCarrito.reduce(
        (sum, item) => sum + item.product.precio_venta * item.quantity,
        0
    );

    const handleConfirmar = async () => {
        if (productosEnCarrito.length === 0) {
            toast.error("Agrega al menos un producto.");
            return;
        }
        setEnviando(true);
        try {
            const payload = {
                id_usuario: user.id_usuario,
                id_sucursal: user.id_sucursal,
                id_cliente: selectedCliente !== "none" ? Number(selectedCliente) : null,
                notas: notas.trim() || null,
                productos: productosEnCarrito.map((item) => ({
                    id_unidad_venta: item.product.id_unidad_venta,
                    id_producto: item.product.id_producto,
                    nombre_producto: item.product.nombre_producto,
                    cantidad: item.quantity,
                    precio_unitario: item.product.precio_venta,
                    precio_mayoreo: false,
                    sku_pieza: item.product.sku_presentacion,
                })),
            };

            let res;
            if (isEditing && id) {
                res = await editarPedidoApi(Number(id), payload);
            } else {
                res = await crearPedidoApi(payload);
            }

            if (res.success) {
                toast.success(isEditing ? `Pedido #${id} actualizado.` : `Pedido #${res.data} creado.`);
                clearCart();
                navigate("/pedidos");
            } else {
                toast.error(res.message || "Error al procesar el pedido.");
            }
        } catch {
            toast.error("Error de conexión.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-3 bg-white border-b border-gray-200 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 shrink-0"
                    onClick={() => navigate("/pedidos")}
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>

                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <Input
                        autoFocus
                        placeholder="Buscar producto..."
                        className="pl-9 h-10 bg-gray-50 border-gray-200 text-sm rounded-full"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-24">
                {loadingProductos ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : productosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                        <Package className="w-12 h-12 mb-3 opacity-25" />
                        <p className="text-sm font-medium">Sin resultados</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {productosPaginados.map((p) => {
                            const enCarrito = cantidadEnCarrito(p.id_unidad_venta);
                            const sinStock = p.stock_disponible_presentacion <= 0;
                            const stockBajo = !sinStock && p.stock_disponible_presentacion <= 5;

                            return (
                                <div
                                    key={p.id_unidad_venta}
                                    className={`flex items-center gap-3 px-4 py-4 transition-colors ${
                                        sinStock
                                            ? "opacity-40"
                                            : enCarrito > 0
                                            ? "bg-blue-50"
                                            : ""
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-900 text-base leading-tight">
                                                {p.nombre_producto}
                                            </span>
                                            <span className="font-semibold text-blue-600 text-base leading-tight">
                                                {p.nombre_presentacion}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-sm font-bold text-gray-700">
                                                ${p.precio_venta.toFixed(2)}
                                            </span>
                                            {sinStock ? (
                                                <Badge variant="destructive" className="text-xs h-5 px-1.5">
                                                    Sin stock
                                                </Badge>
                                            ) : stockBajo ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs h-5 px-1.5 text-orange-600 border-orange-200 bg-orange-50"
                                                >
                                                    Quedan {p.stock_disponible_presentacion}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-gray-400">
                                                    Stock: {p.stock_disponible_presentacion}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {enCarrito > 0 ? (
                                            <>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="w-10 h-10 rounded-full border-gray-300 shrink-0"
                                                    onClick={() => decrementQuantity(p.id_unidad_venta)}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="w-8 text-center font-bold text-base text-blue-700 tabular-nums">
                                                    {enCarrito}
                                                </span>
                                                <Button
                                                    size="icon"
                                                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                                    disabled={sinStock}
                                                    onClick={() => incrementQuantity(p.id_unidad_venta)}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                size="icon"
                                                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                                                disabled={sinStock}
                                                onClick={() => addProduct(p)}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {hayMas && (
                            <div ref={sentinelRef} className="py-6 flex flex-col items-center gap-2">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-xs text-gray-400">
                                    Cargando más productos...
                                </span>
                            </div>
                        )}

                        {!hayMas && productosFiltrados.length > 0 && (
                            <div className="py-4 text-center">
                                <span className="text-xs text-gray-400">
                                    {busqueda.trim()
                                        ? `${productosFiltrados.length} resultado${productosFiltrados.length !== 1 ? "s" : ""}`
                                        : `${productosFiltrados.length} productos en total`
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {totalItems > 0 && (
                <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-white border-t border-gray-200 z-50">
                    <Button
                        className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold shadow-lg gap-3"
                        onClick={() => setCarritoAbierto(true)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
                                {totalItems}
                            </div>
                            <span>Ver mi pedido</span>
                        </div>
                        <span className="ml-auto font-bold">${totalPedido.toFixed(2)}</span>
                    </Button>
                </div>
            )}

            <Sheet open={carritoAbierto} onOpenChange={setCarritoAbierto}>
                <SheetContent
                    side="bottom"
                    className="rounded-t-3xl px-0 pb-0 max-h-[90dvh] flex flex-col"
                >
                    <SheetHeader className="px-5 pb-2 pt-1">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" />
                                {isEditing ? `Editando Pedido #${id}` : "Mi pedido"}
                            </SheetTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={clearCart}
                            >
                                Limpiar todo
                            </Button>
                        </div>
                    </SheetHeader>

                    <Separator />

                    <div className="flex-1 overflow-y-auto min-h-0 px-5 py-2">
                        <div className="space-y-1">
                            {productosEnCarrito.map((item) => (
                                <div
                                    key={item.product.id_unidad_venta}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="w-9 h-9 rounded-full border-gray-300"
                                            onClick={() => decrementQuantity(item.product.id_unidad_venta)}
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </Button>
                                        <span className="w-6 text-center font-bold text-sm tabular-nums">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            size="icon"
                                            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => incrementQuantity(item.product.id_unidad_venta)}
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 text-sm leading-tight truncate">
                                            {item.product.nombre_producto} <span className="text-blue-600">{item.product.nombre_presentacion}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            ${item.product.precio_venta.toFixed(2)} c/u
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-bold text-sm text-gray-900">
                                            ${(item.product.precio_venta * item.quantity).toFixed(2)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeProduct(item.product.id_unidad_venta)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Separator />

                    <div className="px-5 pt-3 pb-6 space-y-3 shrink-0">
                        {/* ── Selector de cliente con buscador ── */}
                        <div className="relative" ref={clienteDropdownRef}>
                            {/* Trigger */}
                            <button
                                type="button"
                                onClick={() => {
                                    setClienteDropdownAbierto(prev => !prev);
                                    setBusquedaCliente("");
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left hover:border-blue-300 transition-colors"
                            >
                                <UserRound className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className={`flex-1 truncate ${clienteSeleccionado ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                                    {clienteSeleccionado ? clienteSeleccionado.nombre_cliente : "Asignar a cliente (opcional)"}
                                </span>
                                {clienteSeleccionado && (
                                    <span
                                        role="button"
                                        onClick={(e) => { e.stopPropagation(); setSelectedCliente("none"); }}
                                        className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {clienteDropdownAbierto && (
                                <div className="absolute bottom-full mb-1 left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                    {/* Buscador */}
                                    <div className="p-2 border-b border-gray-100">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                                                value={busquedaCliente}
                                                onChange={(e) => setBusquedaCliente(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Lista parcial (max 50) */}
                                    <div className="max-h-44 overflow-y-auto">
                                        <button
                                            type="button"
                                            className="w-full px-3 py-2 text-sm text-left text-gray-500 hover:bg-gray-50 italic"
                                            onClick={() => { setSelectedCliente("none"); setClienteDropdownAbierto(false); }}
                                        >
                                            Sin cliente asignado
                                        </button>

                                        {clientesVisibles.length === 0 ? (
                                            <p className="px-3 py-3 text-xs text-gray-400 text-center">Sin resultados</p>
                                        ) : (
                                            clientesVisibles.map(c => (
                                                <button
                                                    key={c.id_cliente}
                                                    type="button"
                                                    className={`w-full px-3 py-2 text-sm text-left transition-colors ${
                                                        String(c.id_cliente) === selectedCliente
                                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                                            : "hover:bg-gray-50 text-gray-800"
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedCliente(String(c.id_cliente));
                                                        setClienteDropdownAbierto(false);
                                                        setBusquedaCliente("");
                                                    }}
                                                >
                                                    {c.nombre_cliente}
                                                    {c.telefono && (
                                                        <span className="ml-2 text-xs text-gray-400">{c.telefono}</span>
                                                    )}
                                                </button>
                                            ))
                                        )}

                                        {hayMasClientes && (
                                            <p className="px-3 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
                                                Mostrando {MAX_CLIENTES_VISIBLES} de {clientesFiltrados.length} — busca para filtrar
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Textarea
                            placeholder="Notas del pedido (opcional)"
                            className="text-sm bg-gray-50 border-gray-200 resize-none rounded-xl"
                            rows={2}
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            maxLength={200}
                        />

                        <div className="flex justify-between items-center px-1">
                            <span className="text-gray-500 text-sm">Total estimado</span>
                            <span className="text-2xl font-bold text-gray-900">
                                ${totalPedido.toFixed(2)}
                            </span>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base gap-2 shadow-lg"
                            disabled={enviando}
                            onClick={handleConfirmar}
                        >
                            {enviando ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    {isEditing ? "Guardando cambios..." : "Enviando pedido..."}
                                </>
                            ) : (
                                <>
                                    <FileCheck className="w-5 h-5" />
                                    {isEditing ? "Guardar cambios" : "Confirmar pedido"}
                                </>
                            )}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}