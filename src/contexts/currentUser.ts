import type { authCredentials } from "@/types/Auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";



type currentUser = {
    user: authCredentials; // <--- El carrito ahora contiene CartItems
    addUser: (User: authCredentials) => void; // Añade o incrementa cantidad
    clearUser: () => void; // Elimina todos los Medicamentos
};

export const useCurrentUser = create(
    persist<currentUser>(
        (set) => ({
            user: {
                id_usuario: 0,
                usuario: "",
                email: "",
                id_rol: 0,
                rol: "",
                id_sucursal: 0,
                sucursal: "",
                permisos: []
            },
            addUser: (newUser: authCredentials) => {
                console.log("Usuario actualizado:");
                set({ user: newUser }); // <-- reemplaza el objeto
            },
            clearUser: () => {
                console.log("Limpiando User");
                set({
                    user: {
                        id_usuario: 0,
                        usuario: "",
                        email: "",
                        id_rol: 0,
                        rol: "",
                        id_sucursal: 0,
                        sucursal: "",
                        permisos: []
                    }
                });
            },
        }),
        {
            name: "currentUser", // Cambiado nombre para evitar conflictos si la versión vieja aún existe
            storage: createJSONStorage(() => localStorage)
        }
    )
);