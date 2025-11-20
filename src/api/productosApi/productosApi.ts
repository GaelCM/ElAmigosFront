import type {  ProductoEspecialInput, ProductoFormFinal, ProductoVentaResponse } from "@/types/Producto";


export const getProductoVenta=async(sku:string,idSucursal:number)=>{
    const res=await fetch(`http://localhost:3000/api/productos/productoVenta/${sku}/${idSucursal}`);
    const data=await res.json();
    return data as ProductoVentaResponse;
}

export const getProductos=async(idSucursal:number)=>{
    const res=await fetch(`http://localhost:3000/api/productos/getProductos/${idSucursal}`);
    const data=await res.json();
    return data as ProductoVentaResponse;
}

export const insertarProductoApi=async(formData:ProductoFormFinal)=>{
    const res=await fetch(`http://localhost:3000/api/productos/nuevoProducto`,{
        method:"post",
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({formData})
    });
    const data=await res.json();
    return data as {success:boolean,message:string, data: number|null};
}

export const insertarProductoEspecialApi=async(formData:ProductoEspecialInput)=>{
    const res=await fetch(`http://localhost:3000/api/productos/nuevoProductoEspecial`,{
        method:"post",
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({formData})
    });
    const data=await res.json();
    return data as {success:boolean,message:string, data: number|null};
}