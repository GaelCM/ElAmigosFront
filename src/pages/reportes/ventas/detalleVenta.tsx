import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { obtenerReporteDetalleVenta } from "@/api/reportesApi/reportesApi";
import { cancelarProductoVentaApi } from "@/api/ventasApi/ventasApi";
import { useCurrentUser } from "@/contexts/currentUser";
import type { DetalleVentaItem } from "@/types/ReporteVentasT";
import {
    Package,
    ShoppingCart,
    Calendar,
    Tag,
    Hash,
    ChevronLeft,
    FileText,
    Layers,
    DollarSign,
    Printer,
    Trash2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { redondearPrecio } from "@/lib/utils";


export default function DetalleVentaPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const idVenta = searchParams.get("id");
    const cliente = searchParams.get("cliente");

    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<DetalleVentaItem[]>([]);
    const { user } = useCurrentUser();

    const fetchDetalle = async () => {
        if (!idVenta) return;
        try {
            setLoading(true);
            const response = await obtenerReporteDetalleVenta(Number(idVenta));
            if (response.success) {
                setItems(response.data);
            } else {
                toast.error(response.message || "Error al obtener el detalle de la venta");
            }
        } catch (error) {
            console.error("Error fetching sale detail:", error);
            toast.error("Error de conexión al servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!idVenta) {
            toast.error("No se proporcionó un ID de venta");
            navigate(-1);
            return;
        }

        fetchDetalle();
    }, [idVenta, navigate]);

    const [dialogOpen, setDialogOpen] = useState<number | null>(null);
    const [cantidadACancelar, setCantidadACancelar] = useState<number>(1);

    const handleCancelarProducto = async (id_detalle: number, nombre: string) => {
        try {
            const res = await cancelarProductoVentaApi(id_detalle, user.id_usuario, cantidadACancelar);
            if (res.success) {
                toast.success(`Producto "${nombre}" ajustado exitosamente`);
                setDialogOpen(null);
                setCantidadACancelar(1); // Reset
                // Volver a cargar los datos para ver los totales actualizados
                await fetchDetalle();
            } else {
                toast.error(res.message || "Error al cancelar el producto");
            }
        } catch (error) {
            console.error("Error al cancelar producto:", error);
            toast.error("Error al procesar el ajuste");
        }
    }

    const totalVenta = redondearPrecio(items.reduce((acc, item) => acc + Number(item.subtotal), 0));
    const totalProductos = items.reduce((acc, item) => acc + Number(item.cantidad), 0);

    // Common sale data from the first item
    const saleInfo = items.length > 0 ? items[0] : null;

    const reimprimirTicket = async () => {
        if (!saleInfo) {
            toast.error("No hay información de la venta para imprimir");
            return;
        }

        try {
            // @ts-ignore
            const api = window["electron-api"];
            const printerName = await api?.getConfig("printer_device");

            if (printerName) {
                const isCut = (await api?.getConfig("printer_cut")) !== false;
                const ticketData = {
                    printerName,
                    sucursal: saleInfo.nombre_sucursal ? "Sucursal " + saleInfo.nombre_sucursal : "Sucursal",
                    id_sucursal: user.id_sucursal,
                    direccion_sucursal: user.direccion_sucursal,
                    telefono_sucursal: user.telefono_sucursal,
                    usuario: saleInfo.nombre_usuario,
                    cliente: saleInfo.id_cliente ? `Cliente: ${cliente}` : "Público General",
                    folio: saleInfo.id_venta,
                    fecha: saleInfo.fecha_venta ? new Date(saleInfo.fecha_venta) : new Date(),
                    productos: items?.map((p: any) => ({
                        cantidad: p.cantidad,
                        nombre: `${p.nombre_producto} ${p.nombre_unidad}`,
                        importe: p.subtotal
                    })) || [],
                    total: totalVenta,
                    pagoCon: saleInfo.monto_recibido,
                    cambio: Math.max(0, saleInfo.cambio || 0),
                    // @ts-ignore
                    ahorro: items.reduce((acc, item) => acc + (item.precio_mayoreo ? ((item.precio_normal || item.precio_unitario) - item.precio_unitario) * item.cantidad : 0), 0) || 0,
                    // @ts-ignore
                    turno: saleInfo.id_turno || "0",
                    cortar: isCut,
                    isCopia: true
                };

                await api?.printTicketVentaEscPos(ticketData);
                toast.success("Ticket enviado a imprimir");
            } else {
                toast.error("No se ha configurado una impresora en ajustes");
            }
        } catch (e) {
            console.error("Error al reimprimir ticket:", e);
            toast.error("Error al conectar con la impresora");
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('es-MX', {
            dateStyle: 'long',
            timeStyle: 'short'
        });
    };

    if (loading) {
        return (
            <div className="p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                </div>
                <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-10 w-10 shrink-0"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">
                                Detalle de Venta
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Registro de transaccion #{idVenta}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-sm">
                            <Hash className="w-4 h-4 mr-1" /> ID: {idVenta}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                            <Calendar className="w-4 h-4 mr-1" /> {formatDate(saleInfo?.fecha_venta)}
                        </Badge>
                        <Button
                            variant="outline"
                            size="default"
                            className="gap-2 text-base text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30"
                            onClick={reimprimirTicket}
                        >
                            <Printer className="w-5 h-5" />
                            Reimprimir Ticket
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sale General Info */}
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Informacion General
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Vendedor</p>
                                    <p className="text-base font-semibold">{saleInfo?.nombre_usuario || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sucursal</p>
                                    <p className="text-base font-semibold">{saleInfo?.nombre_sucursal || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Metodo Pago</p>
                                    <Badge variant="secondary" className="mt-0.5">
                                        {saleInfo?.metodo_pago_descripcion || "Efectivo"}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cliente</p>
                                    <p className="text-base font-semibold">#{saleInfo?.id_cliente || "General"}</p>
                                    <p className="text-base text-muted-foreground">{cliente}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Status Card */}
                    <Card className={`${saleInfo?.estado_venta === 1 ? "bg-green-700 border-green-700" : "bg-red-700 border-red-700"} text-white`}>
                        <CardContent className="pt-6 flex flex-col justify-between h-full">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-white/15 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <Badge className="bg-white/15 text-white border-none text-sm">
                                    {saleInfo?.estado_venta === 1 ? "Completada" : "Cancelada"}
                                </Badge>
                            </div>
                            <div className="mt-4">
                                <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Total de la Venta</p>
                                <h3 className="text-4xl font-bold mt-1">{formatCurrency(totalVenta)}</h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Subtotal"
                        value={formatCurrency(totalVenta)}
                        icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                        accent="emerald"
                    />
                    <StatCard
                        title="Articulos"
                        value={totalProductos}
                        icon={<ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        accent="blue"
                    />
                    <StatCard
                        title="Recibido"
                        value={formatCurrency(saleInfo?.monto_recibido || 0)}
                        icon={<Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        accent="amber"
                    />
                    <StatCard
                        title="Cambio"
                        value={formatCurrency(saleInfo?.cambio || 0)}
                        icon={<Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                        accent="purple"
                    />
                </div>

                {/* Table Section */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Productos en la Venta
                            </CardTitle>
                            <span className="text-sm font-medium text-muted-foreground">{items.length} registros</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="font-semibold text-sm uppercase tracking-wider">Producto</TableHead>
                                    <TableHead className="font-semibold text-sm uppercase tracking-wider">Categoria</TableHead>
                                    <TableHead className="font-semibold text-sm uppercase tracking-wider text-center">Cantidad</TableHead>
                                    <TableHead className="font-semibold text-sm uppercase tracking-wider text-right">Precio Unit.</TableHead>
                                    <TableHead className="font-semibold text-sm uppercase tracking-wider text-center">Tipo</TableHead>
                                    <TableHead className="font-semibold text-sm uppercase tracking-wider text-right">Subtotal</TableHead>
                                    {saleInfo?.estado_venta !== 0 && <TableHead className="font-semibold text-sm uppercase tracking-wider text-center">Ajuste</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow
                                        key={item.id_detalle_venta}
                                        className="group"
                                    >
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-1.5 bg-muted rounded-md">
                                                    <Package className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <span className="font-medium text-base">{item.nombre_producto} {item.nombre_unidad}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className="font-normal text-sm">
                                                {item.nombre_categoria}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-center">
                                            <span className="text-base text-muted-foreground">
                                                {item.cantidad} {item.nombre_unidad}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <span className="text-base text-muted-foreground">{formatCurrency(item.precio_unitario)}</span>
                                        </TableCell>
                                        <TableCell className="py-3 text-center">
                                            {item.precio_mayoreo ? (
                                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none text-sm">Mayoreo</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-sm text-muted-foreground">Menudeo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-right">
                                            <span className="font-semibold text-base">{formatCurrency(item.subtotal)}</span>
                                        </TableCell>
                                        {saleInfo?.estado_venta !== 0 && (
                                            <TableCell className="py-3 text-center">
                                                <Dialog
                                                    open={dialogOpen === item.id_detalle_venta}
                                                    onOpenChange={(open) => {
                                                        if (open) {
                                                            setDialogOpen(item.id_detalle_venta);
                                                            setCantidadACancelar(1); // Default to 1 to remove
                                                        } else {
                                                            setDialogOpen(null);
                                                        }
                                                    }}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive cursor-pointer hover:text-destructive hover:bg-destructive/10 text-sm gap-1.5"
                                                        >
                                                            REMOVER
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <div className="flex items-center gap-2 text-destructive mb-1">
                                                                <AlertCircle className="h-6 w-6" />
                                                                <DialogTitle>Ajustar Venta</DialogTitle>
                                                            </div>
                                                            <DialogDescription className="text-base">
                                                                Estas por devolver/cancelar el producto <span className="font-semibold text-foreground">"{item.nombre_producto}"</span>.
                                                                <br />
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="py-4 space-y-4">
                                                            {Number(item.cantidad) > 1 ? (
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-base font-medium">
                                                                        Cantidad a devolver (Max: {item.cantidad})
                                                                    </label>
                                                                    <div className="flex items-center gap-4">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => setCantidadACancelar(Math.max(1, cantidadACancelar - 1))}
                                                                            disabled={cantidadACancelar <= 1}
                                                                        >
                                                                            -
                                                                        </Button>
                                                                        <span className="text-2xl font-bold w-12 text-center">{cantidadACancelar}</span>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="icon"
                                                                            onClick={() => setCantidadACancelar(Math.min(Number(item.cantidad), cantidadACancelar + 1))}
                                                                            disabled={cantidadACancelar >= Number(item.cantidad)}
                                                                        >
                                                                            +
                                                                        </Button>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Se restaran <span className="font-semibold text-primary">
                                                                            {formatCurrency(Number(item.precio_unitario) * cantidadACancelar)}
                                                                        </span> del total.
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-base text-muted-foreground">
                                                                    Se regresara el stock y se restara <span className="font-semibold text-primary">{formatCurrency(item.subtotal)}</span> del total.
                                                                </p>
                                                            )}
                                                        </div>

                                                        <DialogFooter className="gap-2">
                                                            <Button variant="outline" onClick={() => setDialogOpen(null)}>Cancelar</Button>
                                                            <Button
                                                                onClick={() => handleCancelarProducto(item.id_detalle_venta, item.nombre_producto)}
                                                                variant="destructive"
                                                            >
                                                                Confirmar Devolucion
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {items.length === 0 && (
                            <div className="p-12 text-center">
                                <div className="inline-flex p-3 bg-muted rounded-full mb-3">
                                    <FileText className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-base text-muted-foreground">No se encontraron productos para esta venta.</p>
                            </div>
                        )}

                        <Separator />

                        <div className="p-6 flex justify-end">
                            <div className="w-full md:w-80 space-y-3">
                                <div className="flex justify-between text-base text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatCurrency(totalVenta)}</span>
                                </div>
                                <div className="flex justify-between text-base text-muted-foreground">
                                    <span>Articulos totales</span>
                                    <span className="font-medium">{totalProductos}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold text-foreground">Total</span>
                                    <span className="text-3xl font-bold text-primary">
                                        {formatCurrency(totalVenta)}
                                    </span>
                                </div>
                                <div className="pt-2 space-y-1.5">
                                    <div className="flex justify-between text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        <span>Entrega</span>
                                        <span>Cambio</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(saleInfo?.monto_recibido || 0)}</span>
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(Math.max(0, saleInfo?.cambio || 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    accent: 'emerald' | 'blue' | 'amber' | 'purple';
}

function StatCard({ title, value, icon, accent }: StatCardProps) {
    const accentBorder = {
        emerald: "border-l-emerald-500",
        blue: "border-l-blue-500",
        amber: "border-l-amber-500",
        purple: "border-l-purple-500",
    };

    return (
        <Card className={`border-l-[3px] ${accentBorder[accent]}`}>
            <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                    {icon}
                </div>
                <h3 className="text-2xl font-bold">{value}</h3>
            </CardContent>
        </Card>
    );
}
