import { useCurrentUser } from "@/contexts/currentUser"

import { Package, Plus } from "lucide-react";

import { Link } from "react-router";
import MisTransferencias from "./components/misTransferencia";



export default function TransferenciasPage() {

    const { user } = useCurrentUser();

    if (!user) {
        return <div>error</div>
    }

    return (
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

            <div className="flex justify-end px-5">
                <Link to={"/transferencias/nueva"} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-md hover:shadow-lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transferencia
                </Link>
            </div>

            <div>
                <MisTransferencias></MisTransferencias>
            </div>

        </div>
    )
}