import { obtenerCategoriasApi } from "@/api/categoriasApi/categoriasApi";
import { Button } from "@/components/ui/button";
import { CategoriaCard } from "./components/CategoriaCard";
import DialogEliminarCategoria from "./components/DialogEliminarCategoria";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Categoria } from "@/types/Categoria";

export default function CategoriasPage() {

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [id_categoria, setId_categoria] = useState<number>(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        obtenerCategorias();
    }, []);

    const obtenerCategorias = async () => {
        setLoading(true);
        try {
            const response = await obtenerCategoriasApi();
            if (response.success) {
                setCategorias(response.data);
                console.log(response.data);
                setLoading(false);
            } else {
                setError(response.message);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error al obtener categorias:", error);
            setError("Error al obtener categorias");
            setLoading(false);
        }
    };

    const handleEdit = (id: number) => {
        navigate(`/categorias/editar/${id}`);
    };

    const handleDelete = (id: number) => {
        setId_categoria(id);
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
                    <p className="mt-4 text-slate-600">Cargando categorias...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <DialogEliminarCategoria id_categoria={id_categoria} isOpen={open} setIsOpen={setOpen} obtenerCategorias={obtenerCategorias} />
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Mis Categorías</h1>
                    <p className="text-muted-foreground mt-1">Administra las categorías de tus productos</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link to="/productos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Regresar
                        </Link>
                    </Button>
                    <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link to="/categorias/nueva">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Categoría
                        </Link>
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
                    ))}
                </div>
            ) : categorias.length === 0 ? (
                <div className="text-center py-20 bg-muted/10 rounded-xl border-2 border-dashed border-muted">
                    <p className="text-muted-foreground text-lg">No hay categorías registradas</p>
                    <Button variant="link" asChild className="mt-2">
                        <Link to="/categorias/nueva">Crear mi primera categoría</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categorias.map((categoria) => (
                        <CategoriaCard
                            key={categoria.id_categoria}
                            categoria={categoria}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}