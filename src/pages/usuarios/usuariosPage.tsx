import { obtenerUsuariosApi } from "@/api/usuariosAPi/usuariosApi";
import type { Usuario } from "@/types/Usuarios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { UsuarioCard } from "./components/UsuarioCard";
import { ArrowLeft, Plus } from "lucide-react";


export default function UsuariosPage() {

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const obtenerUsuarios = async () => {
        try {
            const response = await obtenerUsuariosApi();
            if (response.success) {
                setUsuarios(response.data || []);
                setLoading(false);
            } else {
                setError(response.message);
                setLoading(false);
            }
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
            setError("Error al obtener usuarios");
            setLoading(false);
        }
    }

    useEffect(() => {
        obtenerUsuarios();
    }, [])

    const handleEdit = (id: number) => {
        navigate(`/usuarios/editar/${id}`);
    };



    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Error de conexión al servidor: {error}</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Cargando usuarios...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">Usuarios</h1>
                    <p className="text-muted-foreground mt-1">Gestiona el acceso y roles de los usuarios del sistema.</p>
                </div>
                <div className="flex gap-3">
                    <Link to={"/"} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Regresar
                    </Link>
                    <Link to={"/usuarios/nuevo"} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-md hover:shadow-lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Usuario
                    </Link>
                </div>
            </div>

            {usuarios.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/25">
                    <p className="text-muted-foreground text-lg">No hay usuarios registrados.</p>
                    <Link to={"/usuarios/nuevo"} className="text-primary hover:underline mt-2 inline-block">
                        Crear el primer usuario
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usuarios.map((usuario) => (
                        <UsuarioCard
                            key={usuario.id_usuario}
                            usuario={usuario}
                            onEdit={handleEdit}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}