


import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";


const rutasPublicas = ['/login'];

export function AuthGuard(){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    const location=useLocation();
    const navigate=useNavigate();
    const rutaActual=location.pathname;

    useEffect(()=>{
        const token=localStorage.getItem('tkn')
        const isRutaPublica=rutasPublicas.includes(rutaActual)

        if (!token && !isRutaPublica) {
            console.log('🚫 AuthGuard - no ha iniciado sesion el usuario');
            setIsAuthenticated(false);
            navigate("/login")
        }else if (token && isRutaPublica) {
            console.log('✅ AuthGuard - Con token en ruta pública, redirigiendo a home');
            setIsAuthenticated(true);
            navigate("/")
        } else {
            console.log('✅ AuthGuard - Autenticación exitosa');
            setIsAuthenticated(true);
        }
    },[rutaActual,navigate])

    // Si es una ruta pública o está autenticado, mostrar contenido
    if (rutasPublicas.includes(rutaActual) || isAuthenticated) {
        return (
            <Outlet></Outlet>
        )
    }

    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirigiendo...</p>
        </div>
        </div>
    )
}