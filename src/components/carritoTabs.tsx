import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListaProductos } from "@/contexts/listaProductos";
import { Plus, X } from "lucide-react";
import { useState } from "react";

export default function CarritoTabs() {
  const { carritos, carritoActivo, cambiarCarritoActivo, crearCarrito, eliminarCarrito, renombrarCarrito } = useListaProductos();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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

  const handleDeleteCarrito = (id: string) => {
    if (confirm(`¿Eliminar carrito "${carritos.find(c => c.id === id)?.nombre}"?`)) {
      eliminarCarrito(id);
    }
  };

  return (
    <div className="flex gap-2 items-center overflow-x-auto pb-2 shrink-0">
      {/* Botón para crear nuevo carrito */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => crearCarrito()}
        className="shrink-0"
      >
        <Plus className="w-4 h-4 mr-1" />
        Nuevo
      </Button>

      {/* Tabs de carritos */}
      <div className="flex gap-2 overflow-x-auto flex-1">
        {carritos.map((carrito) => (
          <div
            key={carrito.id}
            className={`flex items-center gap-1 px-3 py-1 rounded-md whitespace-nowrap cursor-pointer transition-colors shrink-0 ${
              carritoActivo === carrito.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {editingId === carrito.id ? (
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
                className="h-6 text-xs w-24"
              />
            ) : (
              <>
                <span
                  onClick={() => cambiarCarritoActivo(carrito.id)}
                  onDoubleClick={() => handleRename(carrito.id, carrito.nombre)}
                  className="flex-1"
                >
                  {carrito.nombre}
                  <span className="text-xs ml-1 opacity-70">({carrito.productos.length})</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCarrito(carrito.id);
                  }}
                  className="w-5 h-5 p-0 hover:bg-destructive/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      {carritos.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No hay carritos. Crea uno nuevo para comenzar.
        </p>
      )}
    </div>
  );
}
