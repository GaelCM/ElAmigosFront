import type { DashboardTurno, DashboardTurnoResponse } from "@/types/Dashboard";
import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useCurrentUser } from "@/contexts/currentUser";
import { checkPasswordApi } from "@/api/authApi/authApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, Loader2, ShieldCheck, DollarSign, CreditCard, Banknote, Package, Activity, TrendingUp, BarChart3, PieChart, Tags, HandCoins, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);


export default function DashboardUser({ idTurno }: { idTurno: number }) {

    const { user } = useCurrentUser();
    const [dashboard, setDashboard] = useState<DashboardTurno | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Protección de administrador
    const [isAuthorized, setIsAuthorized] = useState(user.id_rol === 1);
    const [adminPassword, setAdminPassword] = useState("");
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const handleAuthorize = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAuthorizing(true);
        setAuthError(null);

        try {
            // Verificar contra usuario administrador (ID 1)
            const result = await checkPasswordApi(1, adminPassword);
            if (result.success) {
                setIsAuthorized(true);
            } else {
                setAuthError(result.message || "Contraseña de administrador incorrecta");
            }
        } catch (err) {
            setAuthError("Error al validar la contraseña");
        } finally {
            setIsAuthorizing(false);
        }
    };

    useEffect(() => {
        if (!isAuthorized) return;

        const fetchDashboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://elamigos-elamigosapi.xj7zln.easypanel.host/api/dashboard/${idTurno}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('tkn')}`
                    }
                });
                const result: DashboardTurnoResponse = await response.json();
                if (result.success) {
                    setDashboard(result.data);
                } else {
                    setError(result.mensaje);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setError("Error al cargar los datos del dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [idTurno, isAuthorized]);

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 -mt-6">
                <Card className="w-full max-w-md shadow-lg border-muted">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-4 w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                            <Lock className="w-10 h-10 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-black text-foreground tracking-tight">Acceso Restringido</CardTitle>
                        <p className="text-lg text-muted-foreground mt-2">
                            Este apartado requiere autorización de nivel <span className="font-bold text-primary">ADMINISTRADOR</span>.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAuthorize} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="adminPass" className="text-sm uppercase font-bold tracking-wider text-muted-foreground ml-1">Pin Administrativo</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                                    <PasswordInput
                                        id="adminPass"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="h-12 pl-10 text-lg"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {authError && (
                                <Alert variant="destructive">
                                    <AlertDescription className="text-base flex items-center gap-2 font-medium">
                                        <AlertCircle className="h-5 w-5" />
                                        {authError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 gap-2 text-lg font-bold"
                                disabled={isAuthorizing || !adminPassword}
                            >
                                {isAuthorizing ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Verificando Firma...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="h-5 w-5" />
                                        Autorizar Acceso
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-lg font-medium text-muted-foreground">Cargando dashboard...</p>
            </div>
        );
    }

    if (error || !dashboard) {
        return (
            <div className="container mx-auto p-8">
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-lg ml-2">
                        {error || "No se pudo obtener la información"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Preparar datos para gráficas
    const ventasPorHoraData = {
        labels: dashboard.graficas.ventas_por_hora.map(v => v.hora_formato),
        datasets: [
            {
                label: 'Ventas',
                data: dashboard.graficas.ventas_por_hora.map(v => v.total),
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const productosMasVendidosData = {
        labels: dashboard.graficas.productos_mas_vendidos.map(p => p.producto),
        datasets: [
            {
                label: 'Cantidad Vendida',
                data: dashboard.graficas.productos_mas_vendidos.map(p => p.cantidad),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)', // blue
                    'rgba(16, 185, 129, 0.8)', // emerald
                    'rgba(245, 158, 11, 0.8)', // amber
                    'rgba(139, 92, 246, 0.8)', // purple
                    'rgba(239, 68, 68, 0.8)',  // red
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2,
            }
        ]
    };

    const metodosPagoData = {
        labels: dashboard.graficas.metodos_pago.map(m => m.metodo),
        datasets: [
            {
                data: dashboard.graficas.metodos_pago.map(m => m.monto),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)', // efectivo - emerald
                    'rgba(59, 130, 246, 0.8)', // tarjeta - blue
                    'rgba(239, 68, 68, 0.8)', // credito - red
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2,
            }
        ]
    };

    const categoriasMasVendidasData = {
        labels: dashboard.graficas.categorias_mas_vendidas.map(c => c.categoria),
        datasets: [
            {
                label: 'Ingresos',
                data: dashboard.graficas.categorias_mas_vendidas.map(c => c.ingresos),
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)', // purple
                    'rgba(59, 130, 246, 0.8)', // blue
                    'rgba(16, 185, 129, 0.8)', // emerald
                    'rgba(245, 158, 11, 0.8)', // amber
                    'rgba(239, 68, 68, 0.8)',  // red
                ],
                borderColor: [
                    'rgba(139, 92, 246, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2,
            }
        ]
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };


    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-5xl text-primary font-bold tracking-tight">Dashboard de Ventas</h1>
                    <p className="text-lg text-muted-foreground">
                        Turno #{idTurno} • {new Date(dashboard.info_turno.fecha_apertura).toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>
                <div>
                    {dashboard.info_turno.estado === "abierto" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-lg px-4 py-1">
                            Activo
                        </Badge>
                    ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 text-lg px-4 py-1">
                            Cerrado
                        </Badge>
                    )}
                </div>
            </div>

            <Separator />

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:border-primary/50 transition-colors bg-gradient-to-br from-card to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Total Ventas</CardTitle>
                        <DollarSign className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatCurrency(dashboard.metricas_principales.total_ventas)}</div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {dashboard.metricas_principales.numero_ventas} transacciones
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:border-emerald-500/50 transition-colors bg-gradient-to-br from-card to-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ticket Promedio</CardTitle>
                        <Activity className="h-6 w-6 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatCurrency(dashboard.metricas_principales.ticket_promedio)}</div>
                        <p className="text-sm text-muted-foreground mt-1">Por transacción</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-blue-500/50 transition-colors bg-gradient-to-br from-card to-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Efectivo</CardTitle>
                        <Banknote className="h-6 w-6 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatCurrency(dashboard.metricas_principales.ventas_efectivo)}</div>
                        <p className="text-sm text-muted-foreground mt-1">Ventas en efectivo</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-amber-500/50 transition-colors bg-gradient-to-br from-card to-amber-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tarjeta</CardTitle>
                        <CreditCard className="h-6 w-6 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatCurrency(dashboard.metricas_principales.ventas_tarjeta)}</div>
                        <p className="text-sm text-muted-foreground mt-1">Ventas con tarjeta</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-red-500/50 transition-colors bg-gradient-to-br from-card to-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Crédito</CardTitle>
                        <Package className="h-6 w-6 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatCurrency(dashboard.metricas_principales.ventas_credito)}</div>
                        <p className="text-sm text-muted-foreground mt-1">Ventas por cobrar</p>
                    </CardContent>
                </Card>

                <Card className="hover:border-emerald-500/50 transition-colors bg-gradient-to-br from-card to-emerald-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Abonos</CardTitle>
                        <HandCoins className="h-6 w-6 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatCurrency(dashboard.metricas_principales.abonos_credito)}</div>
                        <p className="text-sm text-muted-foreground mt-1">Cobranza recibida</p>
                    </CardContent>
                </Card>
            </div>

            {/* Control de Efectivo y Egresos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-primary" />
                            Control de Efectivo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                            <span className="text-muted-foreground text-lg">Efectivo Inicial:</span>
                            <strong className="text-lg">{formatCurrency(dashboard.control_efectivo.efectivo_inicial)}</strong>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                            <span className="text-muted-foreground text-lg">Ventas Efectivo:</span>
                            <strong className="text-lg">+ {formatCurrency(dashboard.metricas_principales.ventas_efectivo)}</strong>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                            <span className="text-muted-foreground text-lg">Abonos Recibidos:</span>
                            <strong className="text-lg">+ {formatCurrency(dashboard.metricas_principales.abonos_credito)}</strong>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-3">
                            <span className="text-primary font-medium text-lg">Efectivo Esperado:</span>
                            <strong className="text-primary text-xl">{formatCurrency(dashboard.control_efectivo.efectivo_esperado)}</strong>
                        </div>
                        {dashboard.control_efectivo.efectivo_contado !== null && (
                            <>
                                <div className="flex justify-between items-center py-2 border-b border-muted">
                                    <span className="text-muted-foreground text-lg">Efectivo Contado:</span>
                                    <strong className="text-lg">{formatCurrency(dashboard.control_efectivo.efectivo_contado)}</strong>
                                </div>
                                <div className="flex justify-between items-center py-3 bg-muted/30 rounded-lg px-3 mt-2">
                                    <span className="font-medium text-lg">Diferencia:</span>
                                    <strong className={`text-xl ${dashboard.control_efectivo.diferencia! >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {formatCurrency(dashboard.control_efectivo.diferencia!)}
                                    </strong>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-red-500" />
                            Egresos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                            <span className="text-muted-foreground text-lg">Compras:</span>
                            <strong className="text-lg text-right">
                                {formatCurrency(dashboard.egresos.total_compras)}
                                <div className="text-sm text-muted-foreground font-normal">({formatCurrency(dashboard.egresos.compras_efectivo)} efec.)</div>
                            </strong>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-muted">
                            <span className="text-muted-foreground text-lg">Gastos:</span>
                            <strong className="text-lg text-right">
                                {formatCurrency(dashboard.egresos.total_gastos)}
                                <div className="text-sm text-muted-foreground font-normal">({formatCurrency(dashboard.egresos.gastos_efectivo)} efec.)</div>
                            </strong>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-red-50 dark:bg-red-950/20 rounded-lg px-3">
                            <span className="text-red-700 dark:text-red-400 font-medium text-lg">Total Egresos (Efectivo):</span>
                            <strong className="text-red-700 dark:text-red-400 text-xl">{formatCurrency(dashboard.egresos.total_egresos_efectivo)}</strong>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="font-medium text-lg text-muted-foreground">Total General:</span>
                            <strong className="text-xl">{formatCurrency(dashboard.egresos.total_egresos)}</strong>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                            Movimientos de Caja
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-center py-3 border-b border-muted">
                            <span className="text-muted-foreground text-lg">Retiros:</span>
                            <strong className="text-red-500 text-xl">{formatCurrency(dashboard.movimientos_caja.retiros)}</strong>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-muted">
                            <span className="text-muted-foreground text-lg">Depósitos:</span>
                            <strong className="text-emerald-500 text-xl">{formatCurrency(dashboard.movimientos_caja.depositos)}</strong>
                        </div>
                        <div className="flex justify-between items-center py-4 bg-muted/30 rounded-lg px-3 mt-4">
                            <span className="font-medium text-lg">Neto:</span>
                            <strong className={`text-2xl ${dashboard.movimientos_caja.neto >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {formatCurrency(dashboard.movimientos_caja.neto)}
                            </strong>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="xl:col-span-2">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-500" />
                            Ventas por Hora
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[350px] w-full">
                            <Line
                                data={ventasPorHoraData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            padding: 12,
                                            titleFont: { size: 14 },
                                            bodyFont: { size: 13 },
                                            callbacks: {
                                                label: (context) => `Ventas: ${formatCurrency(context.parsed.y ?? 0)}`
                                            }
                                        }
                                    },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: (value) => formatCurrency(Number(value))
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-500" />
                            Productos Más Vendidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[300px] w-full">
                            <Bar
                                data={productosMasVendidosData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    indexAxis: 'y',
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            padding: 12,
                                            callbacks: {
                                                label: (context) => `Cantidad: ${context.parsed.x} unidades`
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            beginAtZero: true
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-amber-500" />
                            Métodos de Pago
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[300px] w-full">
                            <Doughnut
                                data={metodosPagoData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                padding: 15,
                                                font: { size: 12 }
                                            }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            padding: 12,
                                            callbacks: {
                                                label: (context) => {
                                                    const label = context.label || '';
                                                    const value = formatCurrency(Number(context.parsed));
                                                    const percentage = dashboard.graficas.metodos_pago[context.dataIndex].porcentaje;
                                                    return `${label}: ${value} (${percentage.toFixed(1)}%)`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Tags className="h-5 w-5 text-purple-500" />
                            Categorías Más Vendidas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[300px] w-full">
                            <Doughnut
                                data={categoriasMasVendidasData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                padding: 15,
                                                font: { size: 12 }
                                            }
                                        },
                                        tooltip: {
                                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                            padding: 12,
                                            callbacks: {
                                                label: (context) => {
                                                    const label = context.label || '';
                                                    const value = formatCurrency(Number(context.parsed));
                                                    return `${label}: ${value}`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tablas de Detalles */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Top Productos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-base font-bold text-foreground">Producto</TableHead>
                                    <TableHead className="text-base font-bold text-foreground text-right">Cantidad</TableHead>
                                    <TableHead className="text-base font-bold text-foreground text-right">Ingresos</TableHead>
                                    <TableHead className="text-base font-bold text-foreground text-center">Transacciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboard.graficas.productos_mas_vendidos.map((producto, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-base">{producto.producto}</TableCell>
                                        <TableCell className="text-base text-right">{producto.cantidad}</TableCell>
                                        <TableCell className="text-base text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(producto.ingresos)}</TableCell>
                                        <TableCell className="text-base text-center">{producto.transacciones}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Package className="h-5 w-5 text-amber-500" />
                            Top Categorías
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-base font-bold text-foreground">Categoría</TableHead>
                                    <TableHead className="text-base font-bold text-foreground text-right">Cantidad</TableHead>
                                    <TableHead className="text-base font-bold text-foreground text-right">Ingresos</TableHead>
                                    <TableHead className="text-base font-bold text-foreground text-center">Ventas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboard.graficas.categorias_mas_vendidas.map((categoria, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                        <TableCell className="font-medium text-base">{categoria.categoria}</TableCell>
                                        <TableCell className="text-base text-right">{categoria.cantidad}</TableCell>
                                        <TableCell className="text-base text-right text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(categoria.ingresos)}</TableCell>
                                        <TableCell className="text-base text-center">{categoria.ventas}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}