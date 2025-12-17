
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit } from "lucide-react";

import type { MovimientoEfectivo, MovimientoPayload } from "@/types/Egresos";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { useCurrentUser } from "@/contexts/currentUser";
import { actualizarMovimiento, crearMovimiento, obtenerMovimientos } from "@/api/egresosApi/movimientos";
import { toast } from "sonner";



export default function TablaMovimientos({ turnoId }: { turnoId: number | null }) {

    const timeZone = "America/Mexico_City";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateda = format(zonedDate, "yyyy-MM-dd");
    const { user } = useCurrentUser();
    const [fechaDesde, setFechaDesde] = useState<string>(fechaFormateda);
    const [fechaHasta, setFechaHasta] = useState<string>(fechaFormateda);

    const [movimientos, setMovimientos] = useState<MovimientoEfectivo[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MovimientoEfectivo | null>(null);
    const [formData, setFormData] = useState<Partial<MovimientoEfectivo>>({});

    const handleOpenModal = (item?: MovimientoEfectivo) => {
        setEditingItem(item || null);
        if (item) {
            setFormData({ ...item });
        } else {
            setFormData({ monto: 0, tipo_movimiento: 0, concepto: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };



    const handleSave = async () => {
        const payload: MovimientoPayload = {
            id_sucursal: user.id_sucursal,
            id_turno: turnoId || undefined,
            id_usuario: user.id_usuario,
            monto: Number(formData.monto),
            tipo_movimiento: Number(formData.tipo_movimiento),
            concepto: formData.concepto || "",
            fecha_movimiento: editingItem ? editingItem.fecha_movimiento : undefined
        };

        try {
            if (editingItem) {
                const res = await actualizarMovimiento({
                    id_movimiento: editingItem.id_movimiento,
                    ...payload
                })
                if (res.success) {
                    fetchMovimientos();
                    toast.success("Movimiento actualizado exitosamente");
                    handleCloseModal()
                }
            } else {
                const res = await crearMovimiento(payload);
                if (res.success) {
                    toast.success("Movimiento creado exitosamente");

                    // --- INICIO LÓGICA DE IMPRESIÓN Y APERTURA ---
                    try {
                        const printerName = localStorage.getItem("printer_device");
                        if (printerName) {
                            const { generateMovementTicketHTML } = await import("@/utils/ticketGenerator");

                            const ticketHtml = generateMovementTicketHTML({
                                sucursal: "Sucursal " + user.id_sucursal,
                                usuario: user.usuario,
                                fecha: new Date(),
                                monto: payload.monto,
                                concepto: payload.concepto,
                                tipo: payload.tipo_movimiento === 1 ? "DEPÓSITO" : "RETIRO"
                            });

                            // @ts-ignore
                            window["electron-api"]?.printAndOpen({
                                content: ticketHtml,
                                printerName
                            });
                        }
                    } catch (printError) {
                        console.error("Error al imprimir comprobante de movimiento:", printError);
                        toast.error("Error al imprimir comprobante de movimiento");
                    }
                    // --- FIN LÓGICA DE IMPRESIÓN ---

                    fetchMovimientos();
                    handleCloseModal();
                } else {
                    toast.error("Error al crear movimiento");
                }
            }
        } catch (error) {
            console.error("Error saving movimiento", error);
        }
    };

    const fetchMovimientos = async () => {
        setLoading(true);
        try {
            const gastosData = await obtenerMovimientos({ id_rol: user.id_rol, id_sucursal: user.id_sucursal, id_turno: turnoId || undefined, fecha_desde: fechaDesde, fecha_hasta: fechaHasta });
            setMovimientos(gastosData.data);
        } catch (error) {
            console.error("Error fetching movimientos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovimientos();
    }, [fechaDesde, fechaHasta])



    return (
        <div className="space-y-4">
            <section className="w-full px-4 mb-6">
                <div className="flex gap-4 items-end justify-center flex-wrap">
                    <div className="space-y-2">
                        <Label htmlFor="fecha-desde" className="text-sm font-medium text-red-500">
                            Fecha desde
                        </Label>
                        <Input
                            id="fecha-desde"
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-40"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fecha-hasta" className="text-sm font-medium text-red-500">
                            Fecha hasta
                        </Label>
                        <Input
                            id="fecha-hasta"
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-40"
                        />
                    </div>

                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                        Buscar
                    </Button>
                </div>
            </section>

            <div className="flex justify-end mb-4">
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600">Cargando movimientos...</p>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Turno</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movimientos.map((item) => (
                                    <TableRow key={item.id_movimiento}>
                                        <TableCell>{item.fecha_movimiento ? new Date(item.fecha_movimiento).toLocaleDateString() : '-'}</TableCell>
                                        <TableCell>{item.id_turno}</TableCell>
                                        <TableCell>{item.id_usuario}</TableCell>
                                        <TableCell className="font-medium">${Number(item.monto).toFixed(2)}</TableCell>
                                        <TableCell>{item.concepto}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${item.tipo_movimiento === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.tipo_movimiento === 1 ? "Depósito" : "Retiro"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>

                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Editar' : 'Nuevo'} Movimiento</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="monto" className="text-right">Monto</Label>
                            <Input
                                id="monto"
                                type="number"
                                value={formData.monto || ''}
                                onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tipo" className="text-right">Tipo</Label>
                            <Select
                                value={formData.tipo_movimiento !== undefined ? String(formData.tipo_movimiento) : "0"}
                                onValueChange={(val) => setFormData({ ...formData, tipo_movimiento: parseInt(val) })}
                            >
                                <SelectTrigger className="w-[180px] col-span-3">
                                    <SelectValue placeholder="Tipo Movimiento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Retiro</SelectItem>
                                    <SelectItem value="1">Depósito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">Concepto</Label>
                            <Input
                                id="desc"
                                value={formData.concepto || ''}
                                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                        <Button type="submit" onClick={handleSave}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
