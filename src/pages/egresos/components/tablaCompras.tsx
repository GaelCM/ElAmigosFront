
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

import type { Compra, CompraPayload } from "@/types/Egresos";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { actualizarCompra, crearCompra, obtenerCompras } from "@/api/egresosApi/compras";
import { useCurrentUser } from "@/contexts/currentUser";
import { toast } from "sonner";





export default function TablaCompras({ turnoId }: { turnoId: number | null }) {

    const timeZone = "America/Mexico_City";
    const now = new Date();
    const zonedDate = toZonedTime(now, timeZone);
    const fechaFormateda = format(zonedDate, "yyyy-MM-dd");


    const [fechaDesde, setFechaDesde] = useState<string>(fechaFormateda);
    const [fechaHasta, setFechaHasta] = useState<string>(fechaFormateda);
    const [loading, setLoading] = useState(false);
    const { user } = useCurrentUser()
    const [compras, setCompras] = useState<Compra[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Compra | null>(null);
    const [formData, setFormData] = useState<Partial<Compra>>({});

    const handleOpenModal = (item?: Compra) => {
        setEditingItem(item || null);
        if (item) {
            setFormData({ ...item });
        } else {
            setFormData({ monto: 0, metodo_pago: 1, id_proveedor: 0, folio: "", descripcion: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };


    const handleSave = async () => {
        const payload: CompraPayload = {
            id_sucursal: user.id_sucursal,
            id_turno: turnoId || undefined,
            id_usuario: user.id_usuario,
            monto: Number(formData.monto),
            metodo_pago: Number(formData.metodo_pago),
            id_proveedor: Number(formData.id_proveedor),
            folio: formData.folio || "",
            descripcion: formData.descripcion || "",
            fecha_compra: editingItem ? editingItem.fecha_compra : undefined
        };
        try {
            if (editingItem) {
                const res = await actualizarCompra({
                    id_compra: editingItem.id_compra,
                    ...payload
                })
                if (res.success) {
                    fetchCompras();
                    toast.success("Compra actualizada exitosamente");
                    handleCloseModal()
                }
            } else {
                const res = await crearCompra(payload)
                if (res.success) {
                    fetchCompras();
                    toast.success("Compra creada exitosamente", {
                        description: `${res.data.id_compra}`
                    });
                    handleCloseModal()
                }
            }
        } catch (error) {
            console.error("Error saving compra", error);
        }

    };

    if (!turnoId) {
        return <div>No se hay un turno abierto</div>;
    }
    const fetchCompras = async () => {
        setLoading(true);
        try {
            const comprasData = await obtenerCompras({ id_rol: user.id_rol, id_sucursal: user.id_sucursal, id_turno: turnoId || undefined, fecha_desde: fechaDesde, fecha_hasta: fechaHasta });
            setCompras(comprasData.data);
        } catch (error) {
            console.error("Error fetching compras", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompras();
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
                    <Plus className="mr-2 h-4 w-4" /> Nueva Compra
                </Button>
            </div>
            {loading ? (
                <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-slate-600">Cargando compras...</p>
                    </div>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Sucursal</TableHead>
                                    <TableHead>Turno</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Folio</TableHead>
                                    <TableHead>Pago</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {compras.length == 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-24 text-center">
                                            No hay compras para esta fecha
                                        </TableCell>

                                    </TableRow>
                                ) : (
                                    compras.map((item) => (
                                        <TableRow key={item.id_compra}>
                                            <TableCell>{item.fecha_compra ? new Date(item.fecha_compra).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>{item.id_sucursal}</TableCell>
                                            <TableCell>{item.id_turno || 'S/T'}</TableCell>
                                            <TableCell>{item.id_usuario}</TableCell>
                                            <TableCell>Prov #{item.id_proveedor}</TableCell>
                                            <TableCell className="font-medium">${Number(item.monto).toFixed(2)}</TableCell>
                                            <TableCell>{item.folio || '-'}</TableCell>
                                            <TableCell>{item.metodo_pago === 1 ? "Efectivo" : "Tarjeta"}</TableCell>
                                            <TableCell>{item.descripcion}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>

                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Editar' : 'Nueva'} Compra</DialogTitle>
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
                            <Label htmlFor="proveedor" className="text-right">ID Prov.</Label>
                            <Input
                                id="proveedor"
                                type="number"
                                value={formData.id_proveedor || ''}
                                onChange={(e) => setFormData({ ...formData, id_proveedor: Number(e.target.value) })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="metodo" className="text-right">Metodo</Label>
                            <Select
                                value={formData.metodo_pago ? String(formData.metodo_pago) : "1"}
                                onValueChange={(val) => setFormData({ ...formData, metodo_pago: parseInt(val) })}
                            >
                                <SelectTrigger className="w-[180px] col-span-3">
                                    <SelectValue placeholder="Seleccione metodo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Efectivo</SelectItem>
                                    <SelectItem value="2">Tarjeta</SelectItem>
                                    <SelectItem value="3">Transferencia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="folio" className="text-right">Folio</Label>
                            <Input
                                id="folio"
                                value={formData.folio || ''}
                                onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right">Descripción</Label>
                            <Input
                                id="desc"
                                value={formData.descripcion || ''}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
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
