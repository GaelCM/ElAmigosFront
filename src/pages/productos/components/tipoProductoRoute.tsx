import { useSearchParams } from "react-router";
import NuevoProductoForm from "./nuevoProductoForm";
import NuevoProductoCompuestoForm from "./nuevoProductoEspForm";


export default function TipoProductoPage(){
    
     const [searchParams] = useSearchParams();
     const tipoProducto = searchParams.get("tipo");
     const id_sucursal = searchParams.get("id");

     if(!tipoProducto || !id_sucursal){
        return(
            <div>
                <h1>Error al encontrar el id</h1>
            </div>
        )
     }
    return(
       <>
          {tipoProducto=="0"?(
             <NuevoProductoForm></NuevoProductoForm>
          ):(
            <NuevoProductoCompuestoForm id_sucursal={parseInt(id_sucursal)} ></NuevoProductoCompuestoForm>
          )}      
       </>
    )
}