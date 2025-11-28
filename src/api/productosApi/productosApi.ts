import type {  ProductoEspecialInput, ProductoFormFinal, ProductoGeneralEspResponse, ProductoGeneralResponse, ProductoVentaResponse } from "@/types/Producto";


export const getProductoVenta=async(sku:string,idSucursal:number)=>{
    const res=await fetch(`http://localhost:3000/api/productos/productoVenta/${sku}/${idSucursal}`,{
        method:"get",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json'
        }
    });
    const data=await res.json();
    return data as ProductoVentaResponse;
}

export const getProductos=async(idSucursal:number)=>{
    const res=await fetch(`http://localhost:3000/api/productos/getProductos/${idSucursal}`,{
        method:"get",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json'
        }
    });
    const data=await res.json();
    return data as ProductoVentaResponse;
}

export const insertarProductoApi=async(formData:ProductoFormFinal)=>{
    const res=await fetch(`http://localhost:3000/api/productos/nuevoProducto`,{
        method:"post",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
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
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json'
        },
        body:JSON.stringify({formData})
    });
    const data=await res.json();
    return data as {success:boolean,message:string, data: number|null};
}


export const obtenerProductoGeneral=async(idProducto:number)=>{
    const res=await fetch(`http://localhost:3000/api/productos/getProducto/${idProducto}`,{
        method:"get",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json'
        }
    });
    const data=await res.json();
    return data as ProductoGeneralResponse;
}

export const obtenerProductoEspGeneral=async(idProducto:number,idSucursal:number)=>{
    const res=await fetch(`http://localhost:3000/api/productos/getProductoEsp/${idProducto}/${idSucursal}`,{
        method:"get",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json'
        }
    });
    const data=await res.json();
    return data as ProductoGeneralEspResponse;
}


export const actualizarProductoApi=async(id_producto:number,formData:ProductoFormFinal)=>{
    const res=await fetch(`http://localhost:3000/api/productos/editarProducto`,{
        method:"post",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            idProducto:id_producto,
            formData
        })
    });
    const data=await res.json();
    return data as {success:boolean,message:string, data: number|null};
}

export const actualizarProductoEspApi=async(id_producto:number,formData:ProductoEspecialInput)=>{
    const res=await fetch(`http://localhost:3000/api/productos/editarProductoEsp`,{
        method:"post",
        headers:{
            'Authorization':`Bearer ${localStorage.getItem('tkn')}`,
            'Content-Type':'application/json',
        },
        body:JSON.stringify({
            idProducto:id_producto,
            formData
        })
    });
    const data=await res.json();
    return data as {success:boolean,message:string, data: number|null};
}