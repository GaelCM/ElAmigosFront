import ProductTable from "@/components/productTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/contexts/currentUser";
import { ArrowLeft, ChevronDown, Plus} from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";


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
     },[navigate,user.id_rol])

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
             <div className="flex justify-end px-10">
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