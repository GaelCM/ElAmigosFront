import type { CarritoPayload } from "@/types/Venta";


export const nuevaVentaApi=async(formData:CarritoPayload)=>{
    const res=await fetch(`http://localhost:3000/api/ventas/nuevaVenta`,{
        method:"post",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json'
        },
        // Enviar el payload directamente, no envuelto en { formData }
        body:JSON.stringify(formData)
    });
    const data=await res.json();
    return data as {success:boolean,message:string, data: number|null};
}


