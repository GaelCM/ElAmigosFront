import { createHashRouter } from "react-router"
import App from "./App"
import HomePage from "./pages/home/home"
import LoginPage from "./auth/login"
import { AuthGuard } from "./auth/authguard"
import ProductosPage from "./pages/productos/productosPage"
import ProductosXSuc from "./pages/productos/components/productosXsuc"
import TipoProductoPage from "./pages/productos/components/tipoProductoRoute"



export const rutas=createHashRouter([
    {
        element:<AuthGuard/>,
        children:[
            {
                path:"/",
                element:<App/>,

                children:[
                    {
                        path:"/",
                        element:<HomePage/>
                    },
                    {
                        path:"/productos",
                        element:<ProductosPage/>
                    },
                    {
                        path:"/productos/sucursal",
                        element:<ProductosXSuc/>
                    },
                     {
                        path:"/productos/nuevoProducto",
                        element:<TipoProductoPage/>
                    }
                ]
            }
        ]
    },
    {
        path:"/login",
        element:<LoginPage/>
    }
])