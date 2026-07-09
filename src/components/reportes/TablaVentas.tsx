import type { ReporteVentaDetallado } from "@/types/ReporteVentasT";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    DollarSign,
    Receipt,
    Clock,
    Package,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Trash,
    Eye,
    Search
} from "lucide-react";
import { useState, useEffect, useRef, Fragment } from "react";
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
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useCurrentUser();
    const navigate = useNavigate();

    // Reset selection when search or sorting changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const filteredVentas = ventas.filter((venta) =>
        venta.id_venta.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Keyboard navigation
    useEffect(() => {
        if (sortedVentas.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Si el diálogo está abierto, bloqueamos la navegación de la tabla
            if (isCancelDialogOpen) return;

            // Don't navigate if focused on input (except Enter to open details)
            if (document.activeElement?.tagName === 'INPUT') {
                if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') {
                    return;
                }
            }

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : sortedVentas.length - 1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < sortedVentas.length - 1 ? prev + 1 : 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedVenta = sortedVentas[selectedIndex];
                    if (selectedVenta) {
                        navigate(`/reportes/detalleVenta?id=${selectedVenta.id_venta}&cliente=${selectedVenta.nombre_cliente}`);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sortedVentas, selectedIndex, navigate]);

    // Automatic scroll to selected row
    useEffect(() => {
        if (tableContainerRef.current && sortedVentas.length > 0) {
            const selectedRow = tableContainerRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedRow) {
                selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [selectedIndex, sortedVentas]);

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

    const totalVentas = filteredVentas.reduce((sum, venta) => {
        return venta.estado_venta === 1 ? sum + Number(venta.total_venta) : sum;
    }, 0);

    const totalCancelado = filteredVentas.reduce((sum, venta) => {
        return venta.estado_venta === 0 ? sum + Number(venta.total_venta) : sum;
    }, 0);

    const ventasExitosas = filteredVentas.filter(v => v.estado_venta === 1).length;
    const ventasCanceladas = filteredVentas.filter(v => v.estado_venta === 0).length;

    const totalProductos = filteredVentas.reduce((sum, venta) => {
        return venta.estado_venta === 1 ? sum + Number(venta.cantidad_productos) : sum;
    }, 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-3 border-primary/20 rounded-full"></div>
                    <div className="absolute inset-0 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">Cargando ventas...</p>
            </div>
        );
    }

    if (ventas.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="rounded-full bg-muted p-5">
                        <Receipt className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold">No hay ventas registradas</h3>
                        <p className="text-sm text-muted-foreground">No se encontraron ventas en el periodo seleccionado</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Estadísticas Resumen */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-[3px] border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Ventas Exitosas
                        </CardTitle>
                        <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{ventasExitosas}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {ventasCanceladas > 0 ? `${ventasCanceladas} canceladas (no sumadas)` : "Sin cancelaciones"}
                        </p>
                    </CardContent>
                </Card>
                {
                    user.id_rol === 1 && (
                        <Card className="border-l-[3px] border-l-emerald-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Ingresos Reales
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                    {formatCurrency(totalVentas)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Excluye {formatCurrency(totalCancelado)} cancelados
                                </p>
                            </CardContent>
                        </Card>
                    )
                }


                <Card className="border-l-[3px] border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Productos Vendidos
                        </CardTitle>
                        <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totalProductos}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            En ventas completadas
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-[3px] border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Ticket Promedio
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                            {formatCurrency(ventasExitosas > 0 ? totalVentas / ventasExitosas : 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            De ventas completadas
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de Ventas */}
            <Card className="overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                <Receipt className="h-4 w-4" />
                                Listado de Ventas
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Haz clic en una fila para ver mas detalles de la venta
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por #Folio o cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                className="pl-9 h-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto" ref={tableContainerRef}>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="w-[40px] px-2 py-3"></TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors px-2 py-3"
                                        onClick={() => handleSort('id_venta')}
                                    >
                                        <span className="font-semibold text-xs uppercase tracking-wider">ID</span>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors px-2 py-3"
                                        onClick={() => handleSort('fecha_venta')}
                                    >
                                        <span className="font-semibold text-xs uppercase tracking-wider">Fecha/Hora</span>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors text-right px-2 py-3"
                                        onClick={() => handleSort('total_venta')}
                                    >
                                        <span className="font-semibold text-xs uppercase tracking-wider">Total</span>
                                    </TableHead>
                                    <TableHead className="px-2 py-3 text-xs uppercase tracking-wider font-semibold whitespace-nowrap">Pago</TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/80 transition-colors text-center px-2 py-3"
                                        onClick={() => handleSort('cantidad_productos')}
                                    >
                                        <span className="font-semibold text-xs uppercase tracking-wider">Pzas</span>
                                    </TableHead>
                                    <TableHead className="px-2 py-3 text-xs uppercase tracking-wider font-semibold">Estado</TableHead>
                                    <TableHead className="px-2 py-3 text-xs uppercase tracking-wider font-semibold">Usuario</TableHead>
                                    <TableHead className="px-2 py-3 text-xs uppercase tracking-wider font-semibold">Cliente</TableHead>
                                    <TableHead className="px-2 py-3 text-xs uppercase tracking-wider font-semibold text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedVentas.map((venta, index) => {
                                    const EstadoIcon = getEstadoConfig(venta.estado_venta).icon;
                                    const isExpanded = expandedVenta === venta.id_venta;
                                    const isSelected = selectedIndex === index;

                                    return (
                                        <Fragment key={venta.id_venta}>
                                            <TableRow
                                                data-index={index}
                                                className={`cursor-pointer transition-all duration-150 select-none ${isSelected
                                                    ? 'bg-blue-300 border-l-2 border-l-primary'
                                                    : 'hover:bg-muted/50'
                                                    }`}
                                                onClick={() => setSelectedIndex(index)}
                                                onDoubleClick={() => navigate(`/reportes/detalleVenta?id=${venta.id_venta}&cliente=${venta.nombre_cliente}`)}
                                            >
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpandedVenta(isExpanded ? null : venta.id_venta);
                                                        }}
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="px-2 py-3 font-mono">
                                                    <span className="text-xl font-semibold">
                                                        #{venta.id_venta}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-2 py-3">
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="text-xl font-medium whitespace-nowrap">
                                                            {formatDate(venta.fecha_venta).split(',')[0]}
                                                        </span>
                                                        <span className="text-md text-muted-foreground whitespace-nowrap">
                                                            {formatTime(venta.fecha_venta)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-2 py-3 text-right">
                                                    <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(venta.total_venta)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-2 py-3">
                                                    <Badge variant="secondary" className="text-xs font-medium whitespace-nowrap">
                                                        {venta.metodo_pago_descripcion}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-2 py-3 text-center">
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {venta.cantidad_productos}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-2 py-3">
                                                    <Badge className={`text-xs font-medium gap-1 ${getEstadoConfig(venta.estado_venta).className}`}>
                                                        <EstadoIcon className="h-3 w-3" />
                                                        {getEstadoConfig(venta.estado_venta).label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-2 py-3">
                                                    <span className="text-sm font-medium truncate max-w-[100px] block">{venta.nombre_usuario}</span>
                                                </TableCell>
                                                <TableCell className="px-2 py-3">
                                                    <span className="text-md font-medium truncate max-w-[120px] block">{venta.nombre_cliente}</span>
                                                </TableCell>
                                                <TableCell className="px-2 py-3">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-8 gap-1.5 text-xs font-medium"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/reportes/detalleVenta?id=${venta.id_venta}&cliente=${venta.nombre_cliente}`);
                                                            }}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Ver
                                                        </Button>
                                                        {user?.id_rol === 1 && (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="h-8 gap-1.5 text-xs font-medium"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    cancelarVenta(venta.id_venta);
                                                                }}
                                                            >
                                                                <Trash className="h-3.5 w-3.5" />
                                                                Cancelar
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Fila Expandida con Detalles */}
                                            {isExpanded && (
                                                <TableRow>
                                                    <TableCell colSpan={10} className="bg-muted/20 p-0">
                                                        <div className="p-5 space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <Receipt className="h-4 w-4 text-primary" />
                                                                <h4 className="text-sm font-semibold">Detalles de Venta #{venta.id_venta}</h4>
                                                            </div>

                                                            <Separator />

                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                                                <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Monto Recibido
                                                                    </label>
                                                                    <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                                                                        {formatCurrency(venta.monto_recibido)}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Cambio
                                                                    </label>
                                                                    <p className="text-base font-semibold text-amber-600 dark:text-amber-400">
                                                                        {formatCurrency(venta.cambio)}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        ID Turno
                                                                    </label>
                                                                    <p className="text-base font-semibold font-mono">
                                                                        #{venta.id_turno}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Estado Turno
                                                                    </label>
                                                                    <p className="text-base font-semibold capitalize">
                                                                        {venta.turno_estado}
                                                                    </p>
                                                                </div>

                                                                <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                                                                    <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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

                                                                <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                        Email Usuario
                                                                    </label>
                                                                    <p className="text-sm font-medium break-all">
                                                                        {venta.email_usuario}
                                                                    </p>
                                                                </div>

                                                                {venta.id_cliente && (
                                                                    <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                            ID Cliente
                                                                        </label>
                                                                        <p className="text-base font-semibold font-mono">
                                                                            #{venta.id_cliente}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {venta.nombre_cliente && (
                                                                    <div className="space-y-1 p-3 rounded-lg bg-card border">
                                                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                                            Nombre Cliente
                                                                        </label>
                                                                        <p className="text-base font-semibold font-mono">
                                                                            {venta.nombre_cliente}
                                                                        </p>
                                                                    </div>
                                                                )}


                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
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
