import { useCurrentUser } from "@/contexts/currentUser"

import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import MisTransferencias from "./components/misTransferencia";



export default function TransferenciasPage() {

    const {user}=useCurrentUser();

    if(!user){
        return <div>error</div>
    }

    return(
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-6">
            <div className="flex justify-center">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Package className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-slate-900">
                        Transferencias de Productos
                        </h1>
                    </div>
            
                </div>
            </div>

            <div>
                <Link to={"/transferencias/nueva"}>
                    <Button>Nueva Transferencia</Button>
                </Link>
            </div>
            
            <div>
                <MisTransferencias></MisTransferencias>
            </div>
            
        </div>
    )
}