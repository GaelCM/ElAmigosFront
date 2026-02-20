
import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { useCurrentUser } from "@/contexts/currentUser"
import { cerrarCorteApi } from "@/api/cortesApi/cortesApi"
import type { CerrarCorteResponse } from "@/types/Cortes"
import FormCerrarCaja from "./components/FormCerrarCaja"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, DollarSign, ArrowUp, ShoppingCart, ShoppingBag, Wallet } from "lucide-react"
import type { DashboardTurno, DashboardTurnoResponse } from "@/types/Dashboard";

export default function CerrarCajaPage() {
    const { user } = useCurrentUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resumenData, setResumenData] = useState<CerrarCorteResponse | null>(null);
    const [idTurno, setIdTurno] = useState<number | null>(null);
    const [dashboard, setDashboard] = useState<DashboardTurno | null>(null);
    const [loadingDashboard, setLoadingDashboard] = useState(false);

    useEffect(() => {
        // Obtener ID del turno de localStorage
        const corteStorage = localStorage.getItem("openCaja");
        if (corteStorage) {
            try {
                const parsed = JSON.parse(corteStorage);
                let currentId: number | null = null;
                if (typeof parsed === 'number') {
                    currentId = parsed;
                } else if (parsed && typeof parsed === 'object' && (parsed.id || parsed.id_turno)) {
                    currentId = parsed.id || parsed.id_turno;
                } else if (!isNaN(Number(corteStorage))) {
                    currentId = Number(corteStorage);
                }

                if (currentId) {
                    setIdTurno(currentId);
                    fetchDashboardData(currentId);
                }
            } catch (e) {
                if (!isNaN(Number(corteStorage))) {
                    const currentId = Number(corteStorage);
                    setIdTurno(currentId);
                    fetchDashboardData(currentId);
                }
            }
        }
    }, []);

    const fetchDashboardData = async (id: number) => {
        setLoadingDashboard(true);
        try {
            const response = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/dashboard/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('tkn')}`
                }
            });
            const result: DashboardTurnoResponse = await response.json();
            if (result.success) {
                setDashboard(result.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard for close page:", error);
        } finally {
            setLoadingDashboard(false);
        }
    };

    const handleCerrarCaja = async (efectivoContado: number, observaciones: string) => {
        if (!user || !user.id_usuario) {
            setError("No se pudo identificar al usuario actual.");
            return;
        }

        if (!idTurno) {
            setError("No se encontró un turno activo para cerrar. Por favor verifica si ya está cerrada.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await cerrarCorteApi({
                id_turno: idTurno,
                id_usuario_cierre: user.id_usuario,
                efectivo_contado: efectivoContado,
                observaciones_cierre: observaciones
            });

            if (response.success) {
                setResumenData(response.data);
                localStorage.removeItem("openCaja");
            } else {
                setError(response.message);
            }
        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado al cerrar la caja.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined) return "$0.00";
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    if (resumenData) {
        // Show Summary
        const { resumen } = resumenData;
        return (
            <div className="container mx-auto p-4 max-w-4xl space-y-6">
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Caja Cerrada Exitosamente</AlertTitle>
                    <AlertDescription className="text-green-700">
                        El turno ha sido cerrado. A continuación se muestra el resumen del corte.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ventas */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-blue-500" /> Ventas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between"><span>Total Ventas:</span> <span className="font-bold">{formatCurrency(resumen.ventas.total)}</span></div>
                            <div className="flex justify-between text-sm"><span>En Efectivo:</span> <span>{formatCurrency(resumen.ventas.efectivo)}</span></div>
                            <div className="flex justify-between text-sm"><span>En Tarjeta:</span> <span>{formatCurrency(resumen.ventas.tarjeta)}</span></div>
                            <div className="flex justify-between text-sm"><span>No. Transacciones:</span> <span>{resumen.ventas.numero}</span></div>
                        </CardContent>
                    </Card>

                    {/* Egresos */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-red-500" /> Egresos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between"><span>Total Egresos:</span> <span className="font-bold text-red-600">-{formatCurrency(resumen.egresos.total)}</span></div>
                            <div className="flex justify-between text-sm"><span>Compras:</span> <span>{formatCurrency(resumen.egresos.compras)}</span></div>
                            <div className="flex justify-between text-sm"><span>Gastos:</span> <span>{formatCurrency(resumen.egresos.gastos)}</span></div>
                        </CardContent>
                    </Card>

                    {/* Movimientos */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowUp className="h-5 w-5 text-orange-500" /> Movimientos de Caja
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between"><span>Depósitos:</span> <span className="text-green-600">+{formatCurrency(resumen.movimientos.depositos)}</span></div>
                            <div className="flex justify-between"><span>Retiros:</span> <span className="text-red-600">-{formatCurrency(resumen.movimientos.retiros)}</span></div>
                        </CardContent>
                    </Card>

                    {/* Cuadre de Efectivo */}
                    <Card className="bg-slate-50 border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" /> Balance de Efectivo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm"><span>Efectivo Inicial:</span> <span>{formatCurrency(resumen.efectivo.inicial)}</span></div>
                            <div className="flex justify-between font-semibold pt-2 border-t">
                                <span>Efectivo Esperado (Sistema):</span>
                                <span>{formatCurrency(resumen.efectivo.esperado)}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Efectivo Contado (Real):</span>
                                <span>{resumen.efectivo.contado !== null ? formatCurrency(resumen.efectivo.contado) : 'N/A'}</span>
                            </div>

                            <div className={`flex justify-between font-bold text-lg pt-2 mt-2 border-t ${resumen.efectivo.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <span>Diferencia:</span>
                                <span>{formatCurrency(resumen.efectivo.diferencia)}</span>
                            </div>
                            {resumen.efectivo.diferencia !== 0 && (
                                <p className="text-xs text-center text-muted-foreground mt-1">
                                    {resumen.efectivo.diferencia < 0 ? "Faltante en caja" : "Sobrante en caja"}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                    >
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-5xl my-10 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Cierre de Caja</h1>
                <p className="text-slate-500">Confirma los montos finales para finalizar tu turno de trabajo.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel de Resumen (Izquierda/Arriba) */}
                <div className="lg:col-span-2 space-y-6">
                    {loadingDashboard ? (
                        <Card className="h-full flex items-center justify-center p-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <p className="text-slate-500 font-medium">Obteniendo resumen actual...</p>
                            </div>
                        </Card>
                    ) : dashboard ? (
                        <div className="grid grid-cols-1 gap-6">
                            {/* KPIs Rápidos */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className=" border-blue-100">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <ShoppingCart className="w-5 h-5 text-blue-600 mb-2" />
                                        <span className="text-[10px] font-black uppercase text-blue-400">Ventas Totales</span>
                                        <span className="text-lg font-black text-blue-700">{formatCurrency(dashboard.metricas_principales.total_ventas)}</span>
                                    </CardContent>
                                </Card>
                                <Card className=" border-green-100">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <DollarSign className="w-5 h-5 text-green-600 mb-2" />
                                        <span className="text-[10px] font-black uppercase text-green-400">Ventas en Efectivo</span>
                                        <span className="text-lg font-black text-green-700">{formatCurrency(dashboard.metricas_principales.ventas_efectivo)}</span>
                                    </CardContent>
                                </Card>
                                <Card className=" border-red-100">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <ShoppingBag className="w-5 h-5 text-red-600 mb-2" />
                                        <span className="text-[10px] font-black uppercase text-red-400">Egresos en Efectivo</span>
                                        <span className="text-lg font-black text-red-700">-{formatCurrency(dashboard.egresos.total_egresos_efectivo)}</span>
                                    </CardContent>
                                </Card>
                                <Card className=" border-orange-100">
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                        <Wallet className="w-5 h-5 text-orange-600 mb-2" />
                                        <span className="text-[10px] font-black uppercase text-orange-400">Efectivo Esperado</span>
                                        <span className="text-lg font-black text-orange-700">{formatCurrency(dashboard.control_efectivo.efectivo_esperado)}</span>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Detalles Desglosados */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="py-3 bg-slate-50/50">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Desglose de Efectivo</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Efectivo Inicial</span>
                                            <span className="font-bold">{formatCurrency(dashboard.control_efectivo.efectivo_inicial)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Ventas en Efectivo</span>
                                            <span className="font-bold text-green-600">+{formatCurrency(dashboard.metricas_principales.ventas_efectivo)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Depósitos</span>
                                            <span className="font-bold text-green-600">+{formatCurrency(dashboard.movimientos_caja.depositos)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Retiros</span>
                                            <span className="font-bold text-red-600">-{formatCurrency(dashboard.movimientos_caja.retiros)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Egresos (Efectivo)</span>
                                            <span className="font-bold text-red-600">-{formatCurrency(dashboard.egresos.total_egresos_efectivo)}</span>
                                        </div>
                                        <div className="pt-3 border-t flex justify-between items-center">
                                            <span className="text-sm font-black uppercase text-slate-700">Total Esperado</span>
                                            <span className="text-xl font-black text-blue-600">{formatCurrency(dashboard.control_efectivo.efectivo_esperado)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="py-3 bg-slate-50/50">
                                        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Otras Métricas</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Ventas con Tarjeta</span>
                                            <span className="font-bold text-slate-700">{formatCurrency(dashboard.metricas_principales.ventas_tarjeta)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Total transacciones</span>
                                            <span className="font-bold text-slate-700">{dashboard.metricas_principales.numero_ventas}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Total Compras</span>
                                            <span className="font-bold text-slate-700">{formatCurrency(dashboard.egresos.total_compras)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Total Gastos</span>
                                            <span className="font-bold text-slate-700">{formatCurrency(dashboard.egresos.total_gastos)}</span>
                                        </div>
                                        <div className="pt-3 border-t flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400">Estado del Turno</span>
                                            <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">{dashboard.info_turno.estado}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Información no disponible</AlertTitle>
                            <AlertDescription>No se pudo cargar el resumen del turno actual.</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Formulario de Cierre (Derecha) */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6 border-2 border-blue-100 shadow-xl overflow-hidden">
                        <CardHeader className="bg-blue-600 text-white">
                            <CardTitle className="text-xl">Finalizar Turno</CardTitle>
                            <CardDescription className="text-blue-100">Ingresa el efectivo real contado.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {!idTurno ? (
                                <Alert className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Sin Turno Activo</AlertTitle>
                                    <AlertDescription>No se detectó un control de caja activo.</AlertDescription>
                                </Alert>
                            ) : (
                                <FormCerrarCaja onSubmit={handleCerrarCaja} isLoading={loading} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
