import { obtenerProveedoresApi } from "@/api/proveedoresApi/proveedoresApi";
import type { Proveedor } from "@/types/Proveedor";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import DialogEliminarProveedor from "./components/DialogEliminarProveedor";
import { ProveedorCard } from "./components/ProveedorCard";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [id_proveedor, setId_proveedor] = useState<number>(0);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        obtenerProveedores();
    }, [])

    const obtenerProveedores = async () => {
        setLoading(true);
        try {
            const res = await obtenerProveedoresApi();
            if (res.success) {
                setProveedores(res.data);
                setError(null);
            } else {
                setProveedores([]);
                setError(res.message);
            }
        } catch (err) {
            console.error(err);
            setError("Error al obtener proveedores");
        } finally {
            setLoading(false);
        }
    }

    const handleEdit = (id: number) => {
        navigate(`/proveedores/editar/${id}`);
    };

    const handleDelete = (id: number) => {
        setId_proveedor(id);
        setOpen(true);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <p className="mt-4 text-red-600 font-medium">Error: {error}</p>
                    <Button variant="outline" className="mt-2" onClick={obtenerProveedores}>Reintentar</Button>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando proveedores...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-10 space-y-8">
            <DialogEliminarProveedor
                id_proveedor={id_proveedor}
                isOpen={open}
                setIsOpen={setOpen}
                obtenerProveedores={obtenerProveedores}
            />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Mis Proveedores</h1>
                    <p className="text-muted-foreground mt-1">Gestiona los proveedores de tu negocio.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link to={"/"}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Regresar
                        </Link>
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all">
                        <Link to={"/proveedores/nueva"}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Proveedor
                        </Link>
                    </Button>
                </div>
            </div>

            {proveedores.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/25">
                    <p className="text-muted-foreground text-lg">No hay proveedores registrados.</p>
                    <Button variant="link" asChild className="mt-2 text-primary">
                        <Link to={"/proveedores/nueva"}>
                            Crear el primer proveedor
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {proveedores.map((proveedor) => (
                        <ProveedorCard
                            key={proveedor.id_proveedor}
                            proveedor={proveedor}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}