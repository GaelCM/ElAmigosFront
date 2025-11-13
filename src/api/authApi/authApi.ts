import type { AuthResponse } from "@/types/Auth";


export const iniciarSesionApi=async(usuario:string,password:string):Promise<AuthResponse>=>{
    const response=await fetch('http://localhost:3000/api/auth/login',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({usuario,password})
    });

    const data=await response.json();
    return data as AuthResponse;
    

}