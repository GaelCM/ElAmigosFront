import { obtenerDetalleTransferenciaApi, recibirYAutorizarTransferenciaApi } from "@/api/transferenciasApi/transferenciasApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/contexts/currentUser";
import type { DetalleTransferenciaDTO } from "@/types/Transferencias";
import { format } from "date-fns";
import { ArrowRight, Calendar, MapPin, Package, User } from "lucide-react";
import { useEffect, useState, Fragment } from "react";
import { toast } from "sonner";

interface DialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    idTransferencia: number;
}

export default function DialogConfirmarAceptarTranseferencia({ isOpen, setIsOpen, idTransferencia }: DialogProps) {

    const [detalleTransferencia, setDetalleTransferencia] = useState<DetalleTransferenciaDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const { user } = useCurrentUser()

    useEffect(() => {
        if (isOpen && idTransferencia) {
            setLoading(true);
            obtenerDetalleTransferenciaApi(idTransferencia).then((res) => {
                if (res.success) {
                    setDetalleTransferencia(res.data);
                } else {
                    setDetalleTransferencia(null);
                }
            }).finally(() => {
                setLoading(false);
            });
        }
    }, [isOpen, idTransferencia]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        return format(new Date(dateString), "dd/MM/yyyy HH:mm");
    };

    const recibirYautorizar = async () => {
        setLoading(true);
        recibirYAutorizarTransferenciaApi(idTransferencia, {
            id_usuario: user.id_usuario,
            aceptar: true,
            productos_recibidos: detalleTransferencia?.productos.map((producto) => ({
                id_producto: producto.id_producto,
                cantidad_recibida: producto.cantidad_enviada,
            }))
        }).then((res) => {
            if (res.success) {
                toast.success("Transferencia recibida exitosamente", {
                    description: res.message,
                });
                setIsOpen(false);
            } else {
                toast.error("Error al recibir la transferencia", {
                    description: res.message,
                });
            }
        }).finally(() => {
            setLoading(false);
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Detalle de Transferencia #{idTransferencia}</DialogTitle>
                    <DialogDescription>
                        Revisa cuidadosamente los productos y cantidades antes de aceptar la transferencia.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : detalleTransferencia ? (
                        <>
                            {/* Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-slate-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Origen
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="font-semibold text-lg">{detalleTransferencia.sucursal_origen}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            <User className="h-3 w-3" /> {detalleTransferencia.usuario_origen}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-slate-50">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" /> Destino
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="font-semibold text-lg">{detalleTransferencia.sucursal_destino}</div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            {detalleTransferencia.usuario_recibe ? (
                                                <><User className="h-3 w-3" /> {detalleTransferencia.usuario_recibe}</>
                                            ) : (
                                                <span className="italic">Pendiente de recibir</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-md text-blue-700">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">Enviado:</span> {formatDate(detalleTransferencia.fecha_envio)}
                                </div>
                                <Badge variant="outline" className="text-sm px-3 py-1 border-blue-200 bg-blue-50 text-blue-700">
                                    {detalleTransferencia.estado}
                                </Badge>
                                {detalleTransferencia.motivo && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground italic">
                                        "{detalleTransferencia.motivo}"
                                    </div>
                                )}
                            </div>

                            <Separator />

                            {/* Products Table */}
                            <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                                <div className="bg-slate-100 p-2 text-sm font-semibold flex justify-between items-center border-b">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4" /> Productos ({detalleTransferencia.productos.length})
                                    </div>
                                    <div className="flex gap-4 text-muted-foreground">
                                        <span>Paquetes: {detalleTransferencia.productos.reduce((acc, prod) => acc + Math.round(prod.cantidad_enviada / prod.factor_conversion_cantidad), 0)}</span>
                                        <span>Piezas: {detalleTransferencia.productos.reduce((acc, prod) => acc + prod.cantidad_enviada, 0)}</span>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead className="text-right">Cant. Enviada</TableHead>
                                                <TableHead className="text-right">Cant. Piezas</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {detalleTransferencia.productos.map((prod) => (
                                                <Fragment key={prod.id_detalle_transferencia}>
                                                    <TableRow className={Number(prod.es_producto_compuesto) === 1 ? "bg-amber-50/30" : ""}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span>{prod.nombre_producto}</span>
                                                                <div className="flex items-center gap-1 flex-wrap">
                                                                    <Badge variant="outline" className="w-fit text-[10px] h-4 px-1.5 bg-slate-100 text-slate-500 border-slate-200 font-normal">
                                                                        {prod.nombre_presentacion}
                                                                    </Badge>
                                                                    {Number(prod.es_producto_compuesto) === 1 && (
                                                                        <Badge variant="secondary" className="w-fit text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-200">
                                                                            Compuesto
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-muted-foreground">{prod.sku_pieza}</TableCell>
                                                        <TableCell className="text-right font-bold">{Math.round(prod.cantidad_enviada / prod.factor_conversion_cantidad)}</TableCell>
                                                        <TableCell className="text-right text-muted-foreground">{prod.cantidad_enviada}</TableCell>
                                                    </TableRow>
                                                    {(Number(prod.es_producto_compuesto) === 1 && prod.componentes && prod.componentes.length > 0) && (
                                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                                            <TableCell colSpan={4} className="py-2 pl-10 border-b">
                                                                <div className="flex flex-col gap-1.5 border-l-2 border-amber-200 pl-4 py-1">
                                                                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Desglose de componentes:</span>
                                                                    {prod.componentes.map((comp, idx) => (
                                                                        <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                                                                            <span className="flex items-center gap-1.5">
                                                                                <div className="w-1 h-1 rounded-full bg-amber-400" />
                                                                                {comp.nombre_componente}
                                                                                <span className="text-[10px] text-slate-400">({comp.cantidad_por_unidad} pza/u)</span>
                                                                            </span>
                                                                            <span className="font-semibold text-slate-800">{comp.total_piezas} piezas</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No se pudo cargar la información de la transferencia.
                        </div>
                    )}
                </div>


                {detalleTransferencia?.estado === "en_transito" && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button variant="outline">Cerrar</Button>
                        </DialogClose>
                        <Button disabled={loading || !detalleTransferencia} className="bg-green-600 hover:bg-green-700" onClick={recibirYautorizar} >
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Confirmar Recepción
                        </Button>
                    </DialogFooter>
                )}

            </DialogContent>
        </Dialog>
    );
}