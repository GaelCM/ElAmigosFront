
import type { Cliente } from "@/types/Cliente";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";


type currentClient = {
    cliente: Cliente; // <--- El carrito ahora contiene CartItems
    addCliente: (cliente: Cliente) => void; // Añade o incrementa cantidad
    clearCliente: () => void; // Elimina todos los Medicamentos
};


export const useCliente = create(
    persist<currentClient>(
        (set) => ({
            cliente: {
                id_cliente: 0,
                nombre_cliente: "",
                direccion: "",
                telefono: "",
            },
            addCliente: (newCliente: Cliente) => {
                console.log("Cliente actualizado:", newCliente);
                set({ cliente: newCliente }); // <-- reemplaza el objeto
            },
            clearCliente: () => {
                console.log("Limpiando cliente");
                set({
                    cliente: {
                        id_cliente: 0,
                        nombre_cliente: "",
                        direccion: "",
                        telefono: "",
                    }
                });
            },
        }),
        {
            name: "currentClient", // Cambiado nombre para evitar conflictos si la versión vieja aún existe
            storage: createJSONStorage(() => localStorage),
        }
    )
);