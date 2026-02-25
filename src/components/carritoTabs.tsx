import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListaProductos } from "@/contexts/listaProductos";
import { Plus, X, Receipt } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CarritoTabs() {
  const { carritos, carritoActivo, cambiarCarritoActivo, crearCarrito, eliminarCarrito, renombrarCarrito } = useListaProductos();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveRename = (id: string) => {
    if (editingName.trim()) {
      renombrarCarrito(id, editingName);
    }
    setEditingId(null);
    setEditingName("");
  };

  const confirmDelete = () => {
    if (deleteId) {
      eliminarCarrito(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="flex gap-2 items-center overflow-x-auto pb-2 shrink-0 scrollbar-hide">
        {/* Botón para crear nuevo carrito */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => crearCarrito()}
          className="shrink-0 h-10 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all px-3 group rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-bold text-xs whitespace-nowrap text-slate-600">Nuevo</span>
        </Button>

        {/* Tabs de carritos */}
        <div className="flex gap-2 overflow-x-auto flex-1 no-scrollbar py-1">
          {carritos.map((carrito) => {
            // Calcular el total de este carrito específico
            const totalCarrito = carrito.productos.reduce(
              (total, item) => {
                const precio = item.usarPrecioMayoreo ? item.product.precio_mayoreo : item.product.precio_venta;
                return total + (precio * item.quantity);
              },
              0
            );

            const isActive = carritoActivo === carrito.id;

            return (
              <div
                key={carrito.id}
                onClick={() => cambiarCarritoActivo(carrito.id)}
                className={`flex flex-col relative min-w-[120px] max-w-[180px] h-10 px-3 py-1 rounded-xl cursor-pointer transition-all border shadow-sm ${isActive
                  ? "bg-primary text-primary-foreground border-primary scale-105 z-10 ring-4 ring-primary/20"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
              >
                {/* Indicador de Ticket Activo (Punto animado) */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary border border-white"></span>
                  </span>
                )}

                {editingId === carrito.id ? (
                  <div className="flex items-center h-full">
                    <Input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => saveRename(carrito.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(carrito.id);
                        if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingName("");
                        }
                      }}
                      className="h-6 text-[10px] w-full bg-white text-slate-900 px-1"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full group">
                    <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                      <div
                        className="flex-1 overflow-hidden flex items-center gap-1"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleRename(carrito.id, carrito.nombre);
                        }}
                      >
                        <Receipt className={`w-3 h-3 shrink-0 ${isActive ? "text-white/70" : "text-primary/50"}`} />
                        <p className={`text-[10px] font-black truncate leading-tight uppercase ${isActive ? "text-white" : "text-slate-800"}`}>
                          {carrito.cliente ? carrito.cliente.nombre_cliente : carrito.nombre}
                        </p>
                      </div>

                      {/* Botón de eliminar */}
                      {carritos.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(carrito.id);
                          }}
                          className={`shrink-0 p-0.5 rounded-full transition-colors ${isActive
                              ? "hover:bg-white/20 text-white/70 hover:text-white"
                              : "hover:bg-slate-200 text-slate-400 hover:text-red-500"
                            }`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <span className={`text-[8px] font-bold ${isActive ? "text-white/80" : "text-slate-400"}`}>
                        {carrito.productos.length} ítems
                      </span>
                      <span className={`text-[10px] font-black tabular-nums ${isActive ? "text-white" : "text-primary"}`}>
                        ${totalCarrito.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {carritos.length === 0 && (
          <p className="text-xs text-muted-foreground italic px-4">
            No hay tickets.
          </p>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar ticket?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el ticket "{carritos.find(c => c.id === deleteId)?.nombre}" y todos sus productos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
