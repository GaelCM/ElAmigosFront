import { obtenerReporteMisEgresosApi } from "@/api/reportesApi/reportesApi";
import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import type { ReporteEgresoItem } from "@/types/Egresos";
import type { Sucursal } from "@/types/Sucursal";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    TrendingDown,
    ShoppingCart,
    Building2,
    Download,
    RefreshCw,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    Search,
    Filter,
    Eye
} from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    LineElement,
    PointElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router";

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

export default function MisEgresos() {
    const timeZone = 'America/Mexico_City';
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateada = format(zonedDate, 'yyyy-MM-dd');

    const [fechaDesde, setFechaDesde] = useState(() => sessionStorage.getItem("misEgresos_fechaDesde") || fechaFormateada);
    const [fechaHasta, setFechaHasta] = useState(() => sessionStorage.getItem("misEgresos_fechaHasta") || fechaFormateada);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [sucursalSelected, setSucursalSelected] = useState<number | undefined>(() => {
        const saved = sessionStorage.getItem("misEgresos_sucursalSelected");
        return saved && saved !== "all" ? parseInt(saved, 10) : undefined;
    });
    const [egresos, setEgresos] = useState<ReporteEgresoItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("misEgresos_searchTerm") || "");

    const containerRef = useRef<HTMLDivElement>(null);
    const hasRestoredScroll = useRef(false);

    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.setItem("misEgresos_fechaDesde", fechaDesde);
    }, [fechaDesde]);

    useEffect(() => {
        sessionStorage.setItem("misEgresos_fechaHasta", fechaHasta);
    }, [fechaHasta]);

    useEffect(() => {
        sessionStorage.setItem("misEgresos_sucursalSelected", sucursalSelected ? sucursalSelected.toString() : "all");
    }, [sucursalSelected]);

    useEffect(() => {
        sessionStorage.setItem("misEgresos_searchTerm", searchTerm);
    }, [searchTerm]);

    useEffect(() => {
        const handleScroll = () => {
            const mainEl = containerRef.current?.closest('main') || document.querySelector('main');
            if (mainEl) {
                sessionStorage.setItem("misEgresos_mainScrollTop", mainEl.scrollTop.toString());
            }
        };

        const mainEl = containerRef.current?.closest('main') || document.querySelector('main');
        if (mainEl) {
            mainEl.addEventListener('scroll', handleScroll, { passive: true });
        }
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (mainEl) {
                mainEl.removeEventListener('scroll', handleScroll);
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (egresos.length > 0 && !hasRestoredScroll.current) {
            const savedScrollTop = sessionStorage.getItem("misEgresos_mainScrollTop");
            if (savedScrollTop) {
                hasRestoredScroll.current = true;

                const restore = () => {
                    const mainEl = containerRef.current?.closest('main') || document.querySelector('main');
                    if (mainEl) {
                        mainEl.scrollTop = parseInt(savedScrollTop, 10);
                    }
                };

                restore();
                const t1 = setTimeout(restore, 50);
                const t2 = setTimeout(restore, 150);
                const t3 = setTimeout(restore, 300);

                return () => {
                    clearTimeout(t1);
                    clearTimeout(t2);
                    clearTimeout(t3);
                };
            }
        }
    }, [egresos.length]);
    const cargarDatos = async () => {
        setLoading(true);
        try {
            const data = await obtenerReporteMisEgresosApi(fechaDesde, fechaHasta, sucursalSelected);
            setEgresos(data.data);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        obtenerSucursalesApi().then(data => {
            setSucursales(data.data);
        });
        cargarDatos();
    }, [sucursalSelected]);

    // Filtrado por término de búsqueda
    const egresosFiltrados = useMemo(() => {
        if (!searchTerm) return egresos;
        const term = searchTerm.toLowerCase();
        return egresos.filter(e =>
            e.descripcion?.toLowerCase().includes(term) ||
            e.folio?.toLowerCase().includes(term) ||
            e.nombre_usuario.toLowerCase().includes(term) ||
            e.tipo_registro.toLowerCase().includes(term)
        );
    }, [egresos, searchTerm]);

    // Métricas
    const totalMonto = egresosFiltrados.reduce((acc, e) => acc + Number(e.monto), 0);
    const totalCompras = egresosFiltrados.filter(e => e.tipo_registro === 'Compra').reduce((acc, e) => acc + Number(e.monto), 0);
    const totalGastos = egresosFiltrados.filter(e => e.tipo_registro === 'Gasto').reduce((acc, e) => acc + Number(e.monto), 0);
    const totalRetiros = egresosFiltrados.filter(e => e.tipo_registro === 'Retiro').reduce((acc, e) => acc + Number(e.monto), 0);
    const totalDepositos = egresosFiltrados.filter(e => e.tipo_registro === 'Deposito').reduce((acc, e) => acc + Number(e.monto), 0);

    // Datos para gráfica de dona (Distribución por Tipo)
    const chartDoughnutData = {
        labels: ['Compras', 'Gastos', 'Retiros', 'Depósitos'],
        datasets: [
            {
                data: [totalCompras, totalGastos, totalRetiros, totalDepositos],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)', // Azul - Compras
                    'rgba(239, 68, 68, 0.8)',  // Rojo - Gastos
                    'rgba(245, 158, 11, 0.8)', // Ámbar - Retiros
                    'rgba(16, 185, 129, 0.8)', // Esmeralda - Depósitos
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(16, 185, 129, 1)',
                ],
                borderWidth: 2,
            },
        ],
    };

    // Datos para gráfica de barras (Egresos por Sucursal)
    const egresosPorSucursal = useMemo(() => {
        const branches: Record<string, number> = {};
        egresosFiltrados.forEach(e => {
            branches[e.nombre_sucursal] = (branches[e.nombre_sucursal] || 0) + Number(e.monto);
        });
        return branches;
    }, [egresosFiltrados]);

    const chartBarData = {
        labels: Object.keys(egresosPorSucursal),
        datasets: [
            {
                label: 'Monto por Sucursal ($)',
                data: Object.values(egresosPorSucursal),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
        },
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value);
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(egresosFiltrados.map(e => ({
            'ID': e.id,
            'Tipo': e.tipo_registro,
            'Fecha': e.fecha,
            'Monto': e.monto,
            'Descripción': e.descripcion,
            'Folio': e.folio,
            'Método Pago': e.metodo_pago_descripcion,
            'Sucursal': e.nombre_sucursal,
            'Usuario': e.nombre_usuario
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Egresos");
        XLSX.writeFile(wb, `Reporte_Egresos_${fechaDesde}_${fechaHasta}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8" ref={containerRef}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            <ArrowDownCircle className="w-9 h-9 text-red-600" />
                            Reporte de Egresos
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm md:text-base">Visualiza y analiza el flujo de salida de efectivo y mercadería</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={exportToExcel}
                            disabled={egresosFiltrados.length === 0}
                            className="hidden md:flex items-center gap-2 border-slate-300"
                        >
                            <Download className="w-4 h-4 text-emerald-600" />
                            Exportar Excel
                        </Button>
                        <Button
                            onClick={cargarDatos}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/80 cursor-pointer text-white shadow-lg shadow-indigo-200"
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Cargando...' : 'Actualizar'}
                        </Button>
                    </div>
                </div>

                {/* Filtros */}
                <Card className="border-none shadow-md overflow-hidden">
                    <div className="h-1 bg-primary w-full" />
                    <CardHeader className="bg-white pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            <Filter className="w-5 h-5 text-indigo-500" />
                            Parámetros del Reporte
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="bg-white pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fecha-desde" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Fecha Desde
                                </Label>
                                <Input
                                    id="fecha-desde"
                                    type="date"
                                    value={fechaDesde}
                                    onChange={(e) => setFechaDesde(e.target.value)}
                                    className="border-slate-200 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fecha-hasta" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Fecha Hasta
                                </Label>
                                <Input
                                    id="fecha-hasta"
                                    type="date"
                                    value={fechaHasta}
                                    onChange={(e) => setFechaHasta(e.target.value)}
                                    className="border-slate-200 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sucursal" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Sucursal
                                </Label>
                                <Select
                                    value={sucursalSelected?.toString() || "all"}
                                    onValueChange={(value) => setSucursalSelected(value === "all" ? undefined : Number(value))}
                                >
                                    <SelectTrigger className="border-slate-200">
                                        <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                                        <SelectValue placeholder="Todas las sucursales" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las sucursales</SelectItem>
                                        {sucursales.map((sucursal) => (
                                            <SelectItem key={sucursal.id_sucursal} value={sucursal.id_sucursal.toString()}>
                                                {sucursal.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="search" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Buscar en resultados
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="search"
                                        placeholder="Descripción, folio, etc..."
                                        className="pl-9 border-slate-200 focus:ring-indigo-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-none shadow-sm bg-primary text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Total Egresos</p>
                                    <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalMonto)}</h3>
                                </div>
                                <div className="p-3 bg-indigo-500/30 rounded-xl">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Compras</p>
                                    <h3 className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(totalCompras)}</h3>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Gastos</p>
                                    <h3 className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(totalGastos)}</h3>
                                </div>
                                <div className="p-3 bg-red-50 rounded-xl">
                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Retiros</p>
                                    <h3 className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(totalRetiros)}</h3>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl">
                                    <ArrowUpCircle className="w-6 h-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Depósitos</p>
                                    <h3 className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(totalDepositos)}</h3>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl">
                                    <ArrowDownCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="border-none shadow-md">
                        <CardHeader className="border-b bg-white">
                            <CardTitle className="text-lg">Distribución por Tipo de Registro</CardTitle>
                            <CardDescription>Monto acumulado por cada categoría</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 bg-white">
                            <div className="h-[300px] flex items-center justify-center">
                                <Doughnut data={chartDoughnutData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader className="border-b bg-white">
                            <CardTitle className="text-lg">Egresos por Sucursal</CardTitle>
                            <CardDescription>Comparativa de gastos entre ubicaciones</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 bg-white">
                            <div className="h-[300px]">
                                <Bar data={chartBarData} options={chartOptions} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Data Table */}
                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-white border-b flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Listado Detallado</CardTitle>
                            <CardDescription>Transacciones individuales en el período</CardDescription>
                        </div>
                        <div className="text-sm font-medium text-slate-500">
                            {egresosFiltrados.length} registros encontrados
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase font-bold">
                                    <tr>
                                        <th className="px-6 py-4">ID / Tipo</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4 text-right">Monto</th>
                                        <th className="px-6 py-4">Descripción</th>
                                        <th className="px-6 py-4">Sucursal</th>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Folio / Metodo</th>
                                        <th className="px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {egresosFiltrados.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                                No se encontraron registros coincidentes.
                                            </td>
                                        </tr>
                                    ) : (
                                        egresosFiltrados.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900">#{item.id}</div>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${item.tipo_registro === 'Compra' ? 'bg-blue-100 text-blue-700' :
                                                        item.tipo_registro === 'Gasto' ? 'bg-red-100 text-red-700' :
                                                            item.tipo_registro === 'Retiro' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {item.tipo_registro}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {format(new Date(item.fecha), 'dd/MM/yyyy HH:mm')}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                    {formatCurrency(item.monto)}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={item.descripcion || ''}>
                                                    {item.descripcion || '--'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-3 h-3 text-slate-400" />
                                                        {item.nombre_sucursal}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {item.nombre_usuario}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-slate-900 font-medium">{item.folio || '--'}</div>
                                                    <div className="text-xs text-slate-500">{item.metodo_pago_descripcion || 'No especificado'}</div>
                                                </td>
                                                {
                                                    item.tipo_registro === 'Compra' && (
                                                        <td className="px-6 py-4">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const mainEl = containerRef.current?.closest('main') || document.querySelector('main');
                                                                    if (mainEl) {
                                                                        sessionStorage.setItem("misEgresos_mainScrollTop", mainEl.scrollTop.toString());
                                                                    }
                                                                    navigate(`/egresos/detalle-compra/${item.id}`);
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                Ver
                                                            </Button>
                                                        </td>
                                                    )
                                                }
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}