import ProductTable from "@/components/productTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/contexts/currentUser";
import { ArrowLeft, ChevronDown, Plus, Barcode } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";


export default function ProductosXSuc(){
     const [searchParams] = useSearchParams();
     const {user}=useCurrentUser()
     const id = searchParams.get("id");
     const sucursal = searchParams.get("sucursal");
     const navigate=useNavigate()

     useEffect(()=>{
        if (user.id_rol === 2) {
        navigate(`/`);
        return;
        }
        // Si es Encargado (id_rol === 3), solo puede acceder al inventario de su sucursal
        if (user.id_rol === 3 && id && parseInt(id) !== user.id_sucursal) {
            toast.error("Solo tienes acceso al inventario de tu sucursal asignada");
            navigate(`/productos/sucursal?id=${user.id_sucursal}&sucursal=${encodeURIComponent(user.sucursal || "Mi Sucursal")}`, { replace: true });
            return;
        }
     },[navigate,user.id_rol, user.id_sucursal, user.sucursal, id])

     if(!id || !sucursal){
        return(
            <div>
                <h1>Error al encontrar el id</h1>
            </div>
        )
     }

     return(
        <div>
             <div className="px-10 py-5 flex flex-col items-center">
                <div className="w-full flex justify-between">
                    <Link to={"/productos"} className="bg-primary text-white p-2 flex rounded-2xl">
                        <ArrowLeft></ArrowLeft>
                        regresar
                    </Link>
                    <Badge variant={"outline"} className="text-primary text-md">{sucursal}</Badge>
                </div>
                <h1 className="text-primary text-4xl font-bold">Mis Productos</h1>
             </div>
             <div className="flex justify-end px-10 gap-3">
                {(user.id_rol === 1 || user.id_rol === 3) && (
                  <Button variant="outline" className="border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold" asChild>
                    <Link to={`/productos/ajuste-rapido?sucursalId=${id}`}>
                      <Barcode className="mr-2 h-4 w-4 text-blue-600" />
                      Ajuste Rápido
                    </Link>
                  </Button>
                )}
                <div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Producto
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to={`/productos/nuevoProducto?tipo=0&id=${id}`} className="cursor-pointer">
                            Producto Normal
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to={`/productos/nuevoProducto?tipo=1&id=${id}`} className="cursor-pointer">
                            Producto Compuesto
                            </Link>
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
             </div>
             <div className="p-10">
             <ProductTable idSucursal={parseInt(id)} ></ProductTable>
             </div>
        </div>
       
     )
}