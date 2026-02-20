import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    Receipt,
    CreditCard,
    Calendar,
    User,
    Building2,
    Clock,
    Package,
    TrendingUp,
    CheckCircle2,
    XCircle,
    AlertCircle,
    DollarSign,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
    Settings,
    Trash,
    Eye,
    Search
} from "lucide-react";
import { useState } from "react";
import DialogCancelarVenta from "./DialogCancelarVenta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/contexts/currentUser";
import { useNavigate } from "react-router";
import { Input } from "@/components/ui/input";

interface TablaVentasProps {
    ventas: ReporteVentaDetallado[];
    loading?: boolean;
    onVentaCancelada?: () => void;
}

type SortField = 'fecha_venta' | 'total_venta' | 'id_venta' | 'cantidad_productos';
type SortDirection = 'asc' | 'desc';

export default function TablaVentas({ ventas, loading = false, onVentaCancelada }: TablaVentasProps) {
    const [sortField, setSortField] = useState<SortField>('fecha_venta');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [expandedVenta, setExpandedVenta] = useState<number | null>(null);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [ventaToCancel, setVentaToCancel] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { user } = useCurrentUser();
    const navigate = useNavigate();

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredVentas = ventas.filter((venta) =>
        venta.id_venta.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedVentas = [...filteredVentas].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (sortField === 'fecha_venta') {
            aValue = new Date(a.fecha_venta).getTime();
            bValue = new Date(b.fecha_venta).getTime();
        } else if (typeof aValue === 'string' || typeof bValue === 'string') {
            aValue = Number(aValue);
            bValue = Number(bValue);
        }

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    };

    const formatTime = (dateString: string) => {
        return format(new Date(dateString), "HH:mm:ss", { locale: es });
    };

    const getEstadoConfig = (estado: number) => {
        const estados = {
            1: {
                label: 'Completada',
                icon: CheckCircle2,
                variant: 'default' as const,
                className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            },
            0: {
                label: 'Cancelada',
                icon: XCircle,
                variant: 'destructive' as const,
                className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20'
            },
            3: {
                label: 'Pendiente',
                icon: AlertCircle,
                variant: 'secondary' as const,
                className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            }
        };
        return estados[estado as keyof typeof estados] || estados[3];
    };

    const cancelarVenta = (id_venta: number) => {
        setVentaToCancel(id_venta);
        setIsCancelDialogOpen(true);
    };

    const totalVentas = filteredVentas.reduce((sum, venta) => sum + Number(venta.total_venta), 0);
    const totalProductos = filteredVentas.reduce((sum, venta) => sum + Number(venta.cantidad_productos), 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-muted-foreground font-medium">Cargando ventas...</p>
            </div>
        );
    }

    if (ventas.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="rounded-full bg-muted p-6">
                        <Receipt className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold">No hay ventas registradas</h3>
                        <p className="text-muted-foreground">No se encontraron ventas en el período seleccionado</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estadísticas Resumen */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Ventas
                        </CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{filteredVentas.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Transacciones realizadas
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ingresos Totales
                        </CardTitle>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(totalVentas)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Monto total vendido
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Productos Vendidos
                        </CardTitle>
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">{totalProductos}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unidades totales
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background hover:shadow-lg transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ticket Promedio
                        </CardTitle>
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">
                            {formatCurrency(filteredVentas.length > 0 ? totalVentas / filteredVentas.length : 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Promedio por venta
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de Ventas */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Listado de Ventas
                            </CardTitle>
                            <CardDescription>
                                Haz clic en una fila para ver más detalles de la venta
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por #Folio de venta..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 bg-yellow-400"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => handleSort('id_venta')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            <span className="font-semibold">ID</span>
                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => handleSort('fecha_venta')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span className="font-semibold">Fecha y Hora</span>
                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors text-right"
                                        onClick={() => handleSort('total_venta')}
                                    >
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="font-semibold">Total</span>
                                            <DollarSign className="h-4 w-4" />
                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            <span className="font-semibold">Método de Pago</span>
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors text-center"
                                        onClick={() => handleSort('cantidad_productos')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Package className="h-4 w-4" />
                                            <span className="font-semibold">Productos</span>
                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="font-semibold">Estado</span>
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span className="font-semibold">Usuario</span>
                                        </div>
                                    </TableHead>
                                    <TableHead>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            <span className="font-semibold">Sucursal</span>
                                        </div>
                                    </TableHead>
                                    {user?.id_rol === 1 && (
                                        <TableHead>
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                <span className="font-semibold">Acciones</span>
                                            </div>
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedVentas.map((venta) => {
                                    const EstadoIcon = getEstadoConfig(venta.estado_venta).icon;
                                    const isExpanded = expandedVenta === venta.id_venta;

                                    return (
                                        <>
                                            <TableRow
                                                key={venta.id_venta}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => setExpandedVenta(isExpanded ? null : venta.id_venta)}
                                            >
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-mono font-semibold">
                                                    <Badge variant="outline" className="bg-primary/5">
                                                        #{venta.id_venta}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-sm">
                                                            {formatDate(venta.fecha_venta)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatTime(venta.fecha_venta)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                                            {formatCurrency(venta.total_venta)}
                                                        </span>
                                                        {venta.cambio > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Cambio: {formatCurrency(venta.cambio)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="gap-1.5">
                                                        <CreditCard className="h-3 w-3" />
                                                        {venta.metodo_pago_descripcion}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">
                                                        {venta.cantidad_productos}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`gap-1.5 ${getEstadoConfig(venta.estado_venta).className}`}>
                                                        <EstadoIcon className="h-3 w-3" />
                                                        {getEstadoConfig(venta.estado_venta).label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                                                            {venta.nombre_usuario.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-sm">{venta.nombre_usuario}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{venta.nombre_sucursal}</span>
                                                    </div>
                                                </TableCell>
                                                {user?.id_rol === 1 && (
                                                    <TableCell>
                                                        <div className="flex items-center gap-2" onClick={() => cancelarVenta(venta.id_venta)}>
                                                            <Trash className="h-4 w-4 text-red-600" />
                                                            <span className="text-sm">Cancelar Venta</span>
                                                        </div>
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <div className="flex items-center gap-2" onClick={() => navigate(`/reportes/detalleVenta?id=${venta.id_venta}`)}>
                                                        <Eye className="h-4 w-4 text-blue-600" />
                                                        <span className="text-sm">Ver</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Fila Expandida con Detalles */}
                                            {isExpanded && (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="bg-muted/30 p-0">
                                                        <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Receipt className="h-5 w-5 text-primary" />
                                                                <h4 className="font-semibold text-lg">Detalles de Venta #{venta.id_venta}</h4>
                                                            </div>

                                                            <Separator />

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                                                <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                        Monto Recibido
                                                                    </label>
                                                                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                                                        {formatCurrency(venta.monto_recibido)}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                        Cambio
                                                                    </label>
                                                                    <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                                                                        {formatCurrency(venta.cambio)}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                        ID Turno
                                                                    </label>
                                                                    <p className="text-lg font-semibold font-mono">
                                                                        #{venta.id_turno}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                        Estado Turno
                                                                    </label>
                                                                    <p className="text-lg font-semibold capitalize">
                                                                        {venta.turno_estado}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                        Apertura Turno
                                                                    </label>
                                                                    <p className="text-sm font-medium">
                                                                        {formatDate(venta.turno_fecha_apertura)}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />
                                                                        {formatTime(venta.turno_fecha_apertura)}
                                                                    </p>
                                                                </div>

                                                                {venta.turno_fecha_cierre && (
                                                                    <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                            Cierre Turno
                                                                        </label>
                                                                        <p className="text-sm font-medium">
                                                                            {formatDate(venta.turno_fecha_cierre)}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                            {formatTime(venta.turno_fecha_cierre)}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                        Email Usuario
                                                                    </label>
                                                                    <p className="text-sm font-medium break-all">
                                                                        {venta.email_usuario}
                                                                    </p>
                                                                </div>

                                                                {venta.id_cliente && (
                                                                    <div className="space-y-1 p-3 rounded-lg bg-background border">
                                                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                                            ID Cliente
                                                                        </label>
                                                                        <p className="text-lg font-semibold font-mono">
                                                                            #{venta.id_cliente}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>


            <DialogCancelarVenta
                isOpen={isCancelDialogOpen}
                setIsOpen={setIsCancelDialogOpen}
                idVenta={ventaToCancel}
                onSuccess={() => {
                    onVentaCancelada?.();
                }}
            />
        </div>
    );
}
