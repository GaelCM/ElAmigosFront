import { useCurrentUser } from "@/contexts/currentUser"
import { Reloj } from "./components/reloj";
import logo from "@/assets/banner.png"
import { ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import DialogNuevoTurno from "./components/dialogNuevoTurno";
import { existCorteApi } from "@/api/cortesApi/cortesApi";
import { toast } from "sonner";

interface BienvenidaProps {
    onCajaOpened: () => void;
}

export default function Bienvenida({ onCajaOpened }: BienvenidaProps) {

    const { user } = useCurrentUser();
    const [isOpen, setIsOpen] = useState(false);

    const handleAbrirCaja = async () => {

        const res = await existCorteApi(user.id_usuario!, user.id_sucursal!);
        if (res.data.existe) {
            localStorage.setItem("openCaja", JSON.stringify(res.data));
            onCajaOpened();
            toast.success("Caja abierta");
        } else {
            setIsOpen(true);
        }
    };

    return (
        <div className="min-h-[90vh]  flex items-center justify-center ">

            <div className="w-full max-w-7xl h-[80vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex ring-1 ring-slate-900/5">

                {/* Left Side - Publicidad / Digital Signage */}
                <div className="w-1/3 bg-blue-600 relative flex flex-col justify-between text-white p-8 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute -top-20 -right-20 opacity-10">
                        <ShoppingBag size={400} />
                    </div>

                    {/* Header Promoción */}
                    <div className="z-10 pt-4">
                        <div className="inline-flex items-center gap-2 bg-yellow-400/90 text-blue-900 px-4 py-1.5 rounded-full font-bold text-xs tracking-wider uppercase mb-6 shadow-md backdrop-blur-xs">
                            <Tag size={14} />
                            <span>Hola</span>
                        </div>
                        <h2 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
                            ¡Sistema <br /><span className="text-yellow-300">{user.sucursal}!</span>
                        </h2>
                        <p className="text-blue-100 text-lg font-medium leading-relaxed opacity-90">
                            Bienvenido, <span className="text-slate-900 font-bold">{user?.usuario}</span>
                        </p>
                    </div>

                    {/* Featured Product Image Layout */}
                    <div className="z-10 relative flex-1 flex items-center justify-center my-4 group cursor-pointer">
                        <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500" />
                        <img
                            src={logo}
                            alt="Promo"
                            className="relative w-[90%] object-contain drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute top-10 right-4 bg-red-600 text-white w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold shadow-xl border-4 border-white/20 animate-pulse">
                            <span className="text-xs font-normal uppercase">Solo</span>
                            <span className="text-2xl leading-none">$45</span>
                        </div>
                    </div>

                    {/* Footer Legal */}
                    <div className="z-10 text-center border-t border-white/10 pt-4">
                        <p className="text-blue-200 text-xs opacity-70">
                            *Aplican restricciones. Válido hasta agotar existencias. Consulte términos en caja.
                        </p>
                    </div>
                </div>

                {/* Right Side - System Interaction */}
                <div className="w-2/3 flex flex-col items-center justify-center relative bg-slate-50/50">
                    {/* Status Bar */}
                    <div className="absolute top-6 right-6 flex items-center gap-3">
                        <div className="px-3 py-1 bg-white rounded-full border border-slate-200 shadow-xs flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-slate-600 tracking-wide">Caja Cerrada • EN LÍNEA</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-8 z-10">
                        {/* Clock Container */}
                        <div className="transform scale-110 mb-4 text-slate-700">
                            <Reloj />
                        </div>

                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-light text-slate-600">
                                Hola de nuevo,
                            </h1>
                            <h2 className="text-5xl font-black text-slate-800 tracking-tight">
                                {user?.usuario || "Operador"}
                            </h2>
                        </div>

                        <button
                            onClick={handleAbrirCaja}
                            className="mt-8 group relative w-72 h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 ease-out transform hover:-translate-y-1 active:translate-y-0"
                        >
                            <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                            <span className="relative flex items-center justify-center gap-3 text-white font-bold text-xl tracking-wide uppercase">
                                Iniciar Turno
                            </span>
                        </button>
                    </div>

                    <div className="absolute bottom-6 text-slate-400 text-[10px] font-mono tracking-widest uppercase">
                        Sistema de Punto de Venta • El Amigo
                    </div>
                </div>
            </div>
            <DialogNuevoTurno isOpen={isOpen} onOpenChange={setIsOpen} onCajaOpened={onCajaOpened} />
        </div>
    )
}