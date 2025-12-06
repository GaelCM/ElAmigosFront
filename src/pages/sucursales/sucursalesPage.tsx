import { obtenerSucursalesApi } from "@/api/sucursalApi/sucursalApi";
import { SucursalCard } from "./components/SucursalCard";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Sucursal } from "@/types/Sucursal";
import DialogEliminarSucursal from "./components/dialogEliminar";



export default function SucursalesPage() {

    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [id_sucursal, setId_sucursal] = useState<number>(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        obtenerSucursales();
    }, []);

    const obtenerSucursales = async () => {
        try {
            const response = await obtenerSucursalesApi();
            if (response.success) {
                setSucursales(response.data);
                setLoading(false);
            } else {
                setError(response.message);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error al obtener sucursales:", error);
            setError("Error al obtener sucursales");
            setLoading(false);
        }
    };

    const handleEdit = (id: number) => {
        navigate(`/sucursales/editar/${id}`);
    };

    const handleDelete = (id: number) => {
        setId_sucursal(id);
        setOpen(true);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Error de conexión al servidor</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando sucursales...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <DialogEliminarSucursal id_sucursal={id_sucursal} isOpen={open} setIsOpen={setOpen} obtenerSucursales={obtenerSucursales} />
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Mis Sucursales</h1>
                    <p className="text-muted-foreground mt-1">Gestiona tus puntos de venta y sus inventarios.</p>
                </div>
                <div className="flex gap-3">
                    <Link to={"/productos"} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Regresar
                    </Link>
                    <Link to={"/sucursales/nueva"} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-md hover:shadow-lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Sucursal
                    </Link>
                </div>
            </div>

            {sucursales.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/25">
                    <p className="text-muted-foreground text-lg">No hay sucursales registradas.</p>
                    <Link to={"/sucursales/nueva"} className="text-primary hover:underline mt-2 inline-block">
                        Crear la primera sucursal
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sucursales.map((sucursal) => (
                        <SucursalCard
                            key={sucursal.id_sucursal}
                            sucursal={sucursal}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}