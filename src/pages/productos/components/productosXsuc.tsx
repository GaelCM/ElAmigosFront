import ProductTable from "@/components/productTable";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/contexts/currentUser";
import { ArrowLeft, Plus} from "lucide-react";
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
                    <Link to={`/productos/nuevoProducto?id=${id}`} className="bg-primary text-white p-2 flex font-semibold rounded-2xl">
                        <Plus></Plus>
                        Nuevo Producto
                    </Link>
                </div>
             </div>
             <div className="p-10">
             <ProductTable idSucursal={parseInt(id)} ></ProductTable>
             </div>
        </div>
       
     )
}