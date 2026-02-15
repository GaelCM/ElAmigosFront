import type { Cliente } from "@/types/Cliente";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, UserPlus, Check, Phone, MapPin, Hash, RefreshCcw, Plus } from "lucide-react";
import { useCliente } from "@/contexts/globalClient";
import { getClientes } from "@/api/clientesApi/clientesApi";
import { toast } from "sonner";
import DialogCreateCliente from "./dialogCreateCliente";

type props = {
  isOpen: boolean,
  setIsOpen: (isOpen: boolean) => void,
  inputRef?: React.RefObject<{ focus: () => void } | null>;
  onSelect?: (cliente: Cliente) => void;
}

export default function AddCliente({ isOpen, setIsOpen, inputRef, onSelect }: props) {
  const { addCliente } = useCliente();
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  // Estado para la navegación por teclado
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await getClientes();
      if (res.success) {
        setClientes(res.data);
      } else {
        toast.error("Error al cargar clientes", { description: res.message });
      }
    } catch (error) {
      console.error("Error fetching clientes:", error);
      toast.error("Error de conexión al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClientes();
      // Resetear búsqueda y selección al abrir
      setSearchTerm("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filtrado local para la búsqueda rápida
  const filteredClientes = clientes.filter(c =>
    c.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefono.includes(searchTerm) ||
    c.id_cliente.toString().includes(searchTerm)
  );

  // Resetear selección cuando cambia la búsqueda
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleSelect = (cliente: Cliente) => {
    if (onSelect) {
      onSelect(cliente);
    } else {
      addCliente(cliente);
    }
    setIsOpen(false);
    setSearchTerm("");
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Importante: Detener propagación para evitar conflicto con Caja.tsx
    e.stopPropagation();

    if (filteredClientes.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredClientes.length - 1));

      // Scroll automático
      const nextIndex = Math.min(selectedIndex + 1, filteredClientes.length - 1);
      document.getElementById(`cliente-row-${nextIndex}`)?.scrollIntoView({ block: 'nearest' });

    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));

      // Scroll automático
      const prevIndex = Math.max(selectedIndex - 1, 0);
      document.getElementById(`cliente-row-${prevIndex}`)?.scrollIntoView({ block: 'nearest' });

    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredClientes[selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false);
          setSearchTerm("");
          setTimeout(() => {
            inputRef?.current?.focus();
          }, 100);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none">
          <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-primary/10 to-transparent flex flex-row items-center justify-between pr-12">
            <DialogTitle className="text-2xl flex items-center gap-2 font-bold text-primary">
              <UserPlus className="w-6 h-6" />
              Seleccionar Cliente
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenCreate(true)}
                className="h-8 rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary transition-all font-semibold gap-1"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchClientes}
                disabled={loading}
                className="h-8 w-8 rounded-full"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </DialogHeader>

          <div className="px-6 py-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar por nombre, teléfono o ID... (↑ ↓ Enter para seleccionar)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-11 h-12 text-lg rounded-xl border-2 focus-visible:ring-primary/20 transition-all shadow-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading && clientes.length === 0 ? (
              <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground font-medium">Cargando catálogo de clientes...</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {filteredClientes.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-muted-foreground font-medium">No se encontraron clientes</p>
                    <Button variant="link" onClick={() => setSearchTerm("")} className="text-primary">
                      Limpiar búsqueda
                    </Button>
                  </div>
                ) : (
                  filteredClientes.map((c, index) => (
                    <button
                      key={c.id_cliente}
                      id={`cliente-row-${index}`}
                      onClick={() => handleSelect(c)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left group
                        ${index === selectedIndex
                          ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                          : 'border-transparent bg-card hover:bg-accent hover:border-primary/30'
                        }`}
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold text-lg leading-none transition-colors truncate ${index === selectedIndex ? 'text-primary' : 'group-hover:text-primary'}`}>
                            {c.nombre_cliente}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-md">
                            <Hash className="w-3.5 h-3.5" />
                            {c.id_cliente}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {c.telefono}
                          </span>
                        </div>

                        {c.direccion && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/50 p-2 rounded-lg mt-1 italic">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{c.direccion}</span>
                          </div>
                        )}
                      </div>

                      <div className={`ml-4 transition-all scale-90 ${index === selectedIndex ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}>
                        <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                          <Check className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DialogCreateCliente
        isOpen={openCreate}
        onClose={setOpenCreate}
        onSuccess={() => {
          fetchClientes();
        }}
      />
    </>
  );
}