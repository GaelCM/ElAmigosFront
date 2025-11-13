import type { SucursalResponse } from "@/types/Sucursal";

export const obtenerSucursalesApi=async():Promise<SucursalResponse>=>{
    try {
        const res=await fetch(`http://localhost:3000/api/sucursales`);
        if(!res.ok){
            throw new Error(`Error del servidor: ${res.status}`);
        }
        const data=await res.json();
        return data as SucursalResponse;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
        if (error instanceof TypeError) {
      // Esto suele pasar cuando el servidor no está disponible (p. ej., "Failed to fetch")
        throw new Error("No se pudo conectar con el servidor");
        }
        throw new Error(error.message || "Ocurrió un error inesperado");
    }
    
}