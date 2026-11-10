import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useCurrentUser } from "@/contexts/currentUser";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import {
    getProductoVenta,
    obtenerProductoGeneral,
    actualizarProductoApi,
} from "@/api/productosApi/productosApi";
import type { Sucursal } from "@/types/Sucursal";
import type { ProductoFormFinal } from "@/types/Producto";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Barcode,
    Search,
    CheckCircle2,
    RefreshCw,
    Package,
    Layers,
    Building2,
    Save,
    RotateCcw,
    History,
    X,
} from "lucide-react";
import { toast } from "sonner";

interface HistorialItem {
    id: string;
    nombre: string;
    sku: string;
    fecha: string;
    ajustes: { sucursal: string; antes: number; despues: number }[];
}

export default function AjusteRapidoProducto() {
    const { user } = useCurrentUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialSucursalId = searchParams.get("sucursalId");

    // Validación de acceso: Administradores (id_rol === 1) y Encargados (id_rol === 3)
    useEffect(() => {
        if (user && user.id_rol !== 1 && user.id_rol !== 3) {
            toast.error("Acceso restringido: No tienes permisos para realizar ajustes de inventario");
            navigate("/");
        }
    }, [user, navigate]);

    const isEncargado = user?.id_rol === 3;

    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sucursalFiltro, setSucursalFiltro] = useState<number | "todas">(
        isEncargado ? user.id_sucursal : (initialSucursalId ? parseInt(initialSucursalId) : "todas")
    );

    useEffect(() => {
        if (isEncargado && user.id_sucursal) {
            setSucursalFiltro(user.id_sucursal);
        }
    }, [isEncargado, user?.id_sucursal]);

    const [skuBusqueda, setSkuBusqueda] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Producto cargado
    const [productoActual, setProductoActual] = useState<{
        idProducto: number;
        data: ProductoFormFinal;
    } | null>(null);

    // Cantidades iniciales en BD y cantidades de trabajo en pantalla: idSucursal -> stock (en piezas)
    const [initialQuantities, setInitialQuantities] = useState<Record<number, number>>({});
    const [workingQuantities, setWorkingQuantities] = useState<Record<number, number>>({});
    const [workingMinQuantities, setWorkingMinQuantities] = useState<Record<number, number>>({});

    // Ajustes por variante de presentación: idSucursal -> variantIndex -> delta (+/- cantidad de presentaciones)
    const [variantDeltas, setVariantDeltas] = useState<Record<number, Record<number, number | undefined>>>({});
    const [variantTexts, setVariantTexts] = useState<Record<string, string>>({});

    // Historial de ajustes de la sesión actual
    const [historialSesion, setHistorialSesion] = useState<HistorialItem[]>([]);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Cargar sucursales al montar
    useEffect(() => {
        obtenerSucursalesApi()
            .then((res) => {
                if (res.success && res.data) {
                    setSucursales(res.data);
                }
            })
            .catch((err) => {
                console.error("Error al cargar sucursales:", err);
                toast.error("Error al conectar con las sucursales");
            });
    }, []);

    // Auto-focus en el input del escáner
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const focusScanner = () => {
        setTimeout(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        }, 80);
    };

    // ─── BÚSQUEDA DE PRODUCTO POR SKU / CÓDIGO DE BARRAS ─────────────────────
    const buscarProductoPorSku = async (skuTarget?: string) => {
        const raw = (skuTarget !== undefined ? skuTarget : skuBusqueda).trim();
        if (!raw) {
            toast.warning("Por favor escanea o ingresa un código de barras");
            focusScanner();
            return;
        }

        setIsSearching(true);
        try {
            let idProductoEncontrado: number | null = null;

            // 1. Intentar buscar en la sucursal actual o filtro
            const testSucursalId =
                typeof sucursalFiltro === "number" ? sucursalFiltro : user?.id_sucursal || 1;

            try {
                const resVenta = await getProductoVenta(raw, testSucursalId);
                if (resVenta.success && resVenta.data && resVenta.data.length > 0) {
                    idProductoEncontrado = resVenta.data[0].id_producto;
                }
            } catch (e) {
                console.warn("Fallo en búsqueda directa sucursal:", e);
            }

            // 2. Si no se encontró en esa sucursal, buscar en las demás sucursales disponibles
            if (!idProductoEncontrado && sucursales.length > 0) {
                for (const s of sucursales) {
                    if (s.id_sucursal === testSucursalId) continue;
                    try {
                        const resLoop = await getProductoVenta(raw, s.id_sucursal);
                        if (resLoop.success && resLoop.data && resLoop.data.length > 0) {
                            idProductoEncontrado = resLoop.data[0].id_producto;
                            break;
                        }
                    } catch {
                        // continuar con la siguiente sucursal
                    }
                }
            }

            // 3. Si aún no se encontró, probar con caché local de Electron si existe
            if (!idProductoEncontrado) {
                // @ts-ignore
                const localApi = window["electron-api"];
                if (localApi?.obtenerProductosLocal) {
                    try {
                        const localRes = await localApi.obtenerProductosLocal();
                        if (localRes?.success && Array.isArray(localRes.data)) {
                            const matched = localRes.data.find(
                                (p: any) =>
                                    p.sku_pieza?.toLowerCase() === raw.toLowerCase() ||
                                    p.sku_presentacion?.toLowerCase() === raw.toLowerCase()
                            );
                            if (matched) {
                                idProductoEncontrado = matched.id_producto;
                            }
                        }
                    } catch (e) {
                        console.warn("Fallo en caché local:", e);
                    }
                }
            }

            if (!idProductoEncontrado) {
                toast.error(`Producto no encontrado con el código: "${raw}"`);
                focusScanner();
                return;
            }

            // 4. Obtener información general completa del producto (variantes + inventario global)
            const generalRes = await obtenerProductoGeneral(idProductoEncontrado);
            if (!generalRes.success || !generalRes.data) {
                toast.error("No se pudo obtener el detalle del producto");
                focusScanner();
                return;
            }

            const pData = generalRes.data;
            setProductoActual({
                idProducto: idProductoEncontrado,
                data: pData,
            });

            // Inicializar mapas de stock
            const initialMap: Record<number, number> = {};
            const workingMap: Record<number, number> = {};
            const minMap: Record<number, number> = {};

            (pData.sucursales_inventario || []).forEach((si) => {
                initialMap[si.id_sucursal] = si.cantidad_actual ?? 0;
                workingMap[si.id_sucursal] = si.cantidad_actual ?? 0;
                minMap[si.id_sucursal] = si.cantidad_minima ?? 0;
            });

            // Asegurar que las sucursales que no estaban en sucursales_inventario tengan 0
            sucursales.forEach((s) => {
                if (initialMap[s.id_sucursal] === undefined) {
                    initialMap[s.id_sucursal] = 0;
                    workingMap[s.id_sucursal] = 0;
                    minMap[s.id_sucursal] = 0;
                }
            });

            setInitialQuantities(initialMap);
            setWorkingQuantities(workingMap);
            setWorkingMinQuantities(minMap);
            setVariantDeltas({});
            setVariantTexts({});

            toast.success(`Producto cargado: ${pData.nombre_producto}`);
        } catch (err) {
            console.error("Error al buscar producto:", err);
            toast.error("Error al procesar la búsqueda");
        } finally {
            setIsSearching(false);
        }
    };

    // ─── CONTROL DE AJUSTES EN STOCK ─────────────────────────────────────────

    // 1. Ajuste directo por conteo físico (ej. usuario cuenta 15 piezas en anaquel)
    const handleDirectStockChange = (idSucursal: number, valorInput: string) => {
        if (valorInput === "") {
            setWorkingQuantities((prev) => ({
                ...prev,
                [idSucursal]: initialQuantities[idSucursal] || 0,
            }));
            return;
        }

        const parsed = parseFloat(valorInput);
        if (!isNaN(parsed)) {
            setWorkingQuantities((prev) => ({
                ...prev,
                [idSucursal]: Math.max(0, parsed),
            }));
        }
    };

    // 2. Ajuste inteligente por variante de presentación (sumar/restar cajas, bolsas, piezas)
    const handleVariantDeltaChange = (
        idSucursal: number,
        variantIndex: number,
        textVal: string
    ) => {
        const key = `${idSucursal}-${variantIndex}`;
        setVariantTexts((prev) => ({ ...prev, [key]: textVal }));

        const parsedDelta = textVal === "" ? undefined : parseFloat(textVal);
        const numDelta = isNaN(parsedDelta as number) ? undefined : parsedDelta;

        const newDeltas = {
            ...variantDeltas,
            [idSucursal]: {
                ...(variantDeltas[idSucursal] || {}),
                [variantIndex]: numDelta,
            },
        };
        setVariantDeltas(newDeltas);

        // Calcular el impacto total en piezas físicas de todas las variantes modificadas
        const variantes = productoActual?.data.variantes || [];
        let totalPiezasImpacto = 0;
        const branchDeltas = newDeltas[idSucursal] || {};

        Object.keys(branchDeltas).forEach((vIdxStr) => {
            const vIdx = parseInt(vIdxStr);
            const factor = variantes[vIdx]?.factor_conversion_cantidad || 1;
            const deltaVal = branchDeltas[vIdx];
            if (deltaVal !== undefined && !isNaN(deltaVal)) {
                totalPiezasImpacto += deltaVal * factor;
            }
        });

        const stockInicial = initialQuantities[idSucursal] || 0;
        const nuevoStockCalculado = Math.max(0, parseFloat((stockInicial + totalPiezasImpacto).toFixed(2)));

        setWorkingQuantities((prev) => ({
            ...prev,
            [idSucursal]: nuevoStockCalculado,
        }));
    };

    // 3. Resetear stock de una sucursal a 0
    const handleResetToZero = (idSucursal: number) => {
        setWorkingQuantities((prev) => ({
            ...prev,
            [idSucursal]: 0,
        }));
        // Limpiar textos y deltas
        const newTexts = { ...variantTexts };
        Object.keys(newTexts).forEach((k) => {
            if (k.startsWith(`${idSucursal}-`)) {
                delete newTexts[k];
            }
        });
        setVariantTexts(newTexts);
        setVariantDeltas((prev) => ({ ...prev, [idSucursal]: {} }));
    };

    // 4. Restaurar a como estaba inicialmente antes de editar
    const handleResetToInitial = (idSucursal: number) => {
        setWorkingQuantities((prev) => ({
            ...prev,
            [idSucursal]: initialQuantities[idSucursal] || 0,
        }));
        const newTexts = { ...variantTexts };
        Object.keys(newTexts).forEach((k) => {
            if (k.startsWith(`${idSucursal}-`)) {
                delete newTexts[k];
            }
        });
        setVariantTexts(newTexts);
        setVariantDeltas((prev) => ({ ...prev, [idSucursal]: {} }));
    };

    // ─── GUARDAR AJUSTES EN EL SERVIDOR ──────────────────────────────────────
    const guardarAjustes = async () => {
        if (!productoActual || !user) return;

        // Verificar si hubo cambios reales
        const cambios = sucursales
            .map((s) => {
                const antes = initialQuantities[s.id_sucursal] || 0;
                const despues = workingQuantities[s.id_sucursal] ?? antes;
                return {
                    sucursal: s.nombre,
                    id_sucursal: s.id_sucursal,
                    antes,
                    despues,
                    diferencia: despues - antes,
                };
            })
            .filter((c) => c.diferencia !== 0);

        if (cambios.length === 0) {
            toast.info("No hay cambios de stock que guardar");
            return;
        }

        setIsSaving(true);
        try {
            // Reconstruir la lista de inventario por sucursal actualizada
            const sucursalesInventarioActualizadas = sucursales.map((s) => ({
                id_sucursal: s.id_sucursal,
                cantidad_actual: Math.max(0, workingQuantities[s.id_sucursal] ?? initialQuantities[s.id_sucursal] ?? 0),
                cantidad_minima: Math.max(0, workingMinQuantities[s.id_sucursal] ?? 0),
            }));

            const payloadFinal: ProductoFormFinal = {
                ...productoActual.data,
                sucursales_inventario: sucursalesInventarioActualizadas,
            };

            const res = await actualizarProductoApi(
                productoActual.idProducto,
                payloadFinal,
                user.id_usuario
            );

            if (res.success) {
                toast.success(`¡Stock actualizado con éxito para ${productoActual.data.nombre_producto}!`);

                // Registrar en historial visual de la sesión
                setHistorialSesion((prev) => [
                    {
                        id: String(Date.now()),
                        nombre: productoActual.data.nombre_producto,
                        sku: productoActual.data.sku_pieza || "S/N",
                        fecha: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                        ajustes: cambios.map((c) => ({
                            sucursal: c.sucursal,
                            antes: c.antes,
                            despues: c.despues,
                        })),
                    },
                    ...prev.slice(0, 9), // mantener los últimos 10
                ]);

                // Limpiar producto actual y enfocar escáner listo para el siguiente
                setProductoActual(null);
                setSkuBusqueda("");
                setInitialQuantities({});
                setWorkingQuantities({});
                setWorkingMinQuantities({});
                setVariantDeltas({});
                setVariantTexts({});
                focusScanner();
            } else {
                toast.error(res.message || "Error al actualizar stock en el servidor");
            }
        } catch (err) {
            console.error("Error al guardar ajuste:", err);
            toast.error("Error de comunicación al guardar");
        } finally {
            setIsSaving(false);
        }
    };

    // Sucursales visibles según el filtro
    const sucursalesVisibles = sucursales.filter((s) => {
        if (sucursalFiltro === "todas") return true;
        return s.id_sucursal === sucursalFiltro;
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ─── HEADER PRINCIPAL ────────────────────────────────────────────── */}
            <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2"
                            title="Regresar"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                                    Ajuste Rápido de Stock
                                </h1>
                                <Badge className={`${isEncargado ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"} text-white text-xs font-semibold px-2 py-0.5`}>
                                    {isEncargado ? "Encargado" : "Admin"}
                                </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500">
                                {isEncargado ? `Ajustes de inventario exclusivos para ${user.sucursal}` : "Audita y ajusta inventario al instante escaneando el código de barras"}
                            </p>
                        </div>
                    </div>

                    {/* Selector de sucursal filtro */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        {isEncargado ? (
                            <span className="text-xs sm:text-sm font-semibold rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-800 shadow-2xs">
                                Sucursal: <strong className="text-blue-700">{user.sucursal || "Mi Sucursal"}</strong>
                            </span>
                        ) : (
                            <select
                                value={sucursalFiltro}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSucursalFiltro(val === "todas" ? "todas" : parseInt(val));
                                }}
                                className="h-9 text-xs sm:text-sm font-semibold rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-gray-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
                            >
                                <option value="todas">Todas las sucursales</option>
                                {sucursales.map((s) => (
                                    <option key={s.id_sucursal} value={s.id_sucursal}>
                                        {s.nombre}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── CONTENIDO CENTRAL ───────────────────────────────────────────── */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* BARRA DE ESCÁNER */}
                <Card className="bg-white border border-gray-200 shadow-xs rounded-xl overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                buscarProductoPorSku();
                            }}
                            className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
                        >
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600">
                                    <Barcode className="h-6 w-6" />
                                </div>
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    autoComplete="off"
                                    spellCheck={false}
                                    placeholder="Escanea el código de barras o escribe el SKU y presiona Enter..."
                                    value={skuBusqueda}
                                    onChange={(e) => setSkuBusqueda(e.target.value)}
                                    className="pl-12 pr-10 h-12 text-base sm:text-lg font-semibold bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-gray-900 placeholder:text-gray-400"
                                />
                                {skuBusqueda && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSkuBusqueda("");
                                            focusScanner();
                                        }}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSearching}
                                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 shrink-0"
                            >
                                {isSearching ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        <span>Buscando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-5 w-5" />
                                        <span>Buscar Producto</span>
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1.5">

                                Compatible con lectores láser de código de barras USB y Bluetooth
                            </span>
                            {productoActual && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProductoActual(null);
                                        setSkuBusqueda("");
                                        focusScanner();
                                    }}
                                    className="text-red-600 hover:text-red-700 font-medium underline"
                                >
                                    Limpiar producto
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ─── SI NO HAY PRODUCTO SELECCIONADO: ESTADO VACÍO ──────────────── */}
                {!productoActual && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[320px]">
                            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                <Barcode className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Listo para escanear
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md mb-6">
                                Usa tu lector sobre la lista impresa de inventario para cargar automáticamente el producto y ajustar las existencias en cada sucursal.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-600">
                                <span className="px-2.5 py-1 bg-gray-100 rounded-md font-mono">1. Escanea código</span>
                                <span className="text-gray-400">→</span>
                                <span className="px-2.5 py-1 bg-gray-100 rounded-md font-mono">2. Ajusta conteo</span>
                                <span className="text-gray-400">→</span>
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-mono">3. Guardar</span>
                            </div>
                        </Card>

                        {/* HISTORIAL RECIENTE DE LA SESIÓN */}
                        <Card className="bg-white border border-gray-200 shadow-xs rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                <History className="w-4 h-4 text-blue-600" />
                                <h4 className="font-bold text-sm text-gray-900">
                                    Ajustes en esta sesión ({historialSesion.length})
                                </h4>
                            </div>

                            {historialSesion.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-8 italic">
                                    Aún no has realizado ajustes en esta sesión
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                    {historialSesion.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 text-xs space-y-1"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-gray-900 truncate max-w-[160px]">
                                                    {item.nombre}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    {item.fecha}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-gray-500 font-mono">
                                                SKU: {item.sku}
                                            </div>
                                            <div className="pt-1 border-t border-gray-200/60 space-y-0.5">
                                                {item.ajustes.map((a, i) => (
                                                    <div key={i} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-gray-600 truncate">{a.sucursal}:</span>
                                                        <span className="font-semibold text-gray-800">
                                                            {a.antes} → <span className="text-emerald-700">{a.despues}</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* ─── DETALLE Y AJUSTE DEL PRODUCTO SELECCIONADO ─────────────────── */}
                {productoActual && (
                    <div className="space-y-6">
                        {/* FICHA TÉCNICA RESUMEN DEL PRODUCTO */}
                        <Card className="bg-white border border-gray-200 shadow-xs rounded-xl overflow-hidden">
                            <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/60 to-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                                            {productoActual.data.nombre_producto}
                                        </h2>
                                        {productoActual.data.es_granel ? (
                                            <Badge className="bg-emerald-600 text-white text-xs">Granel</Badge>
                                        ) : (
                                            <Badge className="bg-blue-600 text-white text-xs">Unidad estándar</Badge>
                                        )}
                                    </div>
                                    {productoActual.data.descripcion && (
                                        <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
                                            {productoActual.data.descripcion}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-500 font-mono">
                                        <span>
                                            SKU Base: <strong className="text-gray-900">{productoActual.data.sku_pieza || "S/N"}</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                            Costo Unitario:{" "}
                                            <strong className="text-gray-900">
                                                ${Number(productoActual.data.precio_costo || 0).toFixed(2)}
                                            </strong>
                                        </span>
                                    </div>
                                </div>

                                {/* PRESENTACIONES DISPONIBLES */}
                                <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-2xs shrink-0 sm:max-w-xs">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-blue-600" /> Presentaciones
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {productoActual.data.variantes && productoActual.data.variantes.length > 0 ? (
                                            productoActual.data.variantes.map((v, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[11px] font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md border border-gray-200"
                                                >
                                                    {v.nombre_presentacion || "Pieza"}{" "}
                                                    <span className="text-blue-600 font-bold">({v.factor_conversion_cantidad} pzas)</span>
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400">Pieza individual (1 pza)</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* GRID DE SUCURSALES PARA AJUSTE */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Inventario por Sucursal
                                </h3>
                                <span className="text-xs text-gray-500">
                                    Mostrando {sucursalesVisibles.length} de {sucursales.length} sucursales
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {sucursalesVisibles.map((s) => {
                                    const stockInicial = initialQuantities[s.id_sucursal] || 0;
                                    const stockActualizado = workingQuantities[s.id_sucursal] ?? stockInicial;
                                    const diff = parseFloat((stockActualizado - stockInicial).toFixed(2));
                                    const tieneCambios = diff !== 0;

                                    return (
                                        <Card
                                            key={s.id_sucursal}
                                            className={`bg-white border-2 rounded-xl transition-all shadow-xs flex flex-col justify-between ${tieneCambios
                                                ? "border-blue-500 shadow-md ring-1 ring-blue-400/30"
                                                : "border-gray-200"
                                                }`}
                                        >
                                            {/* HEADER SUCURSAL */}
                                            <CardHeader className="p-4 pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                                                        {s.nombre}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs text-gray-500">
                                                        {s.direccion || "Sucursal activa"}
                                                    </CardDescription>
                                                </div>
                                                {tieneCambios && (
                                                    <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                                                        Modificado
                                                    </Badge>
                                                )}
                                            </CardHeader>

                                            <CardContent className="p-4 space-y-4 flex-1">
                                                {/* INDICADORES: STOCK ACTUAL VS STOCK FINAL */}
                                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-center">
                                                    <div className="border-r border-gray-200 pr-1">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 block">
                                                            Stock Sistema
                                                        </span>
                                                        <span className="text-lg font-black text-gray-800">
                                                            {stockInicial}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 block">piezas</span>
                                                    </div>
                                                    <div className="pl-1">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 block">
                                                            Stock Final
                                                        </span>
                                                        <span
                                                            className={`text-lg font-black ${tieneCambios ? "text-blue-700" : "text-gray-900"
                                                                }`}
                                                        >
                                                            {stockActualizado}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 block">piezas</span>
                                                    </div>
                                                </div>

                                                {/* 1. AJUSTE DIRECTO POR CONTEO FÍSICO */}
                                                <div className="bg-blue-50/50 border border-blue-200 p-3 rounded-lg space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                                            Conteo Físico Real
                                                        </Label>
                                                        {diff !== 0 && (
                                                            <span
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diff > 0
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : "bg-red-50 text-red-600 border-red-200"
                                                                    }`}
                                                            >
                                                                {diff > 0 ? `+${diff}` : diff} pzas
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            placeholder={`Ej. ${stockInicial}`}
                                                            value={workingQuantities[s.id_sucursal] ?? ""}
                                                            onChange={(e) => handleDirectStockChange(s.id_sucursal, e.target.value)}
                                                            className="h-10 text-base font-bold bg-white border-blue-300 focus:border-blue-600 rounded-lg text-gray-900 text-center shadow-2xs"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 italic text-center">
                                                        Escribe el total exacto de piezas contadas físicamente
                                                    </p>
                                                </div>

                                                {/* 2. SURTIR O AJUSTAR POR PRESENTACIÓN (DELTAS +/-) */}
                                                {productoActual.data.variantes && productoActual.data.variantes.length > 0 && (
                                                    <div className="space-y-2 pt-1 border-t border-gray-100">
                                                        <Label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide block">
                                                            Surtir / Ajustar por Presentación
                                                        </Label>

                                                        <div className="space-y-1.5">
                                                            {productoActual.data.variantes.map((v, vIdx) => {
                                                                const key = `${s.id_sucursal}-${vIdx}`;
                                                                const currentText = variantTexts[key] ?? "";

                                                                return (
                                                                    <div
                                                                        key={vIdx}
                                                                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition-colors"
                                                                    >
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-xs font-bold text-gray-800 truncate">
                                                                                {v.nombre_presentacion || "Pieza"}
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-500">
                                                                                Factor: {v.factor_conversion_cantidad} pzas
                                                                            </p>
                                                                        </div>

                                                                        <div className="flex items-center gap-1">
                                                                            <Input
                                                                                type="text"
                                                                                placeholder="+/- 0"
                                                                                value={currentText}
                                                                                onChange={(e) =>
                                                                                    handleVariantDeltaChange(s.id_sucursal, vIdx, e.target.value)
                                                                                }
                                                                                className="h-8 w-20 text-center font-bold text-xs bg-white border-gray-300 focus:border-blue-600 rounded-md"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* STOCK MÍNIMO ALERTA */}
                                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                                    <Label className="text-gray-500 text-[11px] font-semibold">
                                                        Aviso Stock Mínimo:
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={workingMinQuantities[s.id_sucursal] ?? 0}
                                                        onChange={(e) => {
                                                            const v = parseFloat(e.target.value) || 0;
                                                            setWorkingMinQuantities((prev) => ({
                                                                ...prev,
                                                                [s.id_sucursal]: Math.max(0, v),
                                                            }));
                                                        }}
                                                        className="h-7 w-20 text-center text-xs font-bold bg-white border-gray-200 rounded-md"
                                                    />
                                                </div>
                                            </CardContent>

                                            {/* FOOTER ACCIONES RÁPIDAS POR SUCURSAL */}
                                            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleResetToZero(s.id_sucursal)}
                                                    className="text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold h-7 px-2"
                                                >
                                                    Poner en 0
                                                </Button>

                                                {tieneCambios && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleResetToInitial(s.id_sucursal)}
                                                        className="text-[11px] text-gray-600 hover:text-gray-800 hover:bg-gray-200 font-semibold h-7 px-2 flex items-center gap-1"
                                                    >
                                                        <RotateCcw className="w-3 h-3" /> Revertir
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ─── BARRA DE ACCIÓN FLOTANTE / INFERIOR PARA GUARDAR ─────────── */}
                        <div className="sticky bottom-4 z-20 bg-white border-2 border-gray-300 shadow-xl rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">
                                        {productoActual.data.nombre_producto}
                                    </h4>
                                    <p className="text-xs text-gray-500">
                                        Revisa las existencias por sucursal y confirma los cambios para sincronizar la base de datos.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setProductoActual(null);
                                        setSkuBusqueda("");
                                        focusScanner();
                                    }}
                                    disabled={isSaving}
                                    className="border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
                                >
                                    Cancelar
                                </Button>

                                <Button
                                    type="button"
                                    onClick={guardarAjustes}
                                    disabled={isSaving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md flex items-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Guardando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>Guardar Ajuste</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
