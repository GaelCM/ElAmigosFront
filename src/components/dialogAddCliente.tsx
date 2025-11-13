import type { Cliente } from "@/types/Cliente";
import type { EstadoVenta } from "@/types/Venta";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CircleCheck, CircleX } from "lucide-react";
import { useCliente } from "@/contexts/globalClient";



type props={
    isOpen:boolean,
    setIsOpen:(isOpen:boolean)=>void,
    inputRef?: React.RefObject<{ focus: () => void } | null>;
}

export default function AddCliente({isOpen,setIsOpen,inputRef}:props){

  const { addCliente } = useCliente();
  const [idSearch, setIdSearch] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState<EstadoVenta>("Inicio");

 

  const handleAgregar = () => {
    if (clienteEncontrado) {
      addCliente(clienteEncontrado);
      setClienteEncontrado(null);
      setIdSearch("");
      setLoading("Inicio")
      setIsOpen(false);
      setTimeout(() => {
                inputRef?.current?.focus();
        }, 100); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={()=>{
         setIsOpen(false);
        setIdSearch("");
        setLoading("Inicio")
        setTimeout(() => {
                inputRef?.current?.focus();
        }, 100);     
      }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="951 #### ####"
            value={idSearch}
            onChange={(e) => setIdSearch(e.target.value)}
          />
          <Button  disabled={!idSearch}>
            {loading=="Cargando" ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {loading=="Inicio"&&(
            <h1>Numero de telefono</h1>
        )}

        {loading=="Cargando"&&(
            <h1>cargando... cliente</h1>
        )}

        {loading === "Listo" && (
            <>
                {clienteEncontrado ? (
                <div className="mt-4 border rounded-md p-3 space-y-2">
                    <div className="flex justify-center">
                    <CircleCheck width={60} height={60} className="text-green-500" />
                    </div>
                    <p><span className="font-semibold">ID:</span> {clienteEncontrado.idCliente}</p>
                    <p><span className="font-semibold">Nombre:</span> {clienteEncontrado.nombreCliente}</p>
                    <p><span className="font-semibold">Fecha Creación:</span> {clienteEncontrado.fechaCreacion}</p>
                    <Button className="mt-2 w-full" onClick={handleAgregar}>
                    Agregar Cliente
                    </Button>
                </div>
                ) : (
                    <div className="text-center flex flex-col items-center">
                    <CircleX width={60} height={60} className="text-red-500" />
                    <p className="mt-3 text-red-500">Cliente no encontrado</p>
                    </div>
                )}
            </>
        )}
        
      </DialogContent>
    </Dialog>
  );
}