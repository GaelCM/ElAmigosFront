import Bienvenida from "./bienvenida";
import Caja from "./caja";
import { useState, useEffect } from "react";
import { getOpenCajaSession, setOpenCajaSession, clearOpenCajaSession } from "@/utils/cajaSession";
import { existCorteApi } from "@/api/cortesApi/cortesApi";
import { useCurrentUser } from "@/contexts/currentUser";

export default function Home() {
  const { user } = useCurrentUser();
  const [openCaja, setOpenCaja] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkCaja = async () => {
    try {
      // 1. Si hay internet y usuario identificado, validar SIEMPRE con el servidor primero
      if (navigator.onLine && user?.id_usuario && user?.id_sucursal) {
        try {
          const res = await existCorteApi(user.id_usuario, user.id_sucursal);
          if (res?.data?.existe && res.data.id_turno) {
            // El servidor confirma turno abierto: actualizar almacenamiento local con la verdad del servidor
            await setOpenCajaSession(res.data);
            setOpenCaja(JSON.stringify(res.data));
            setLoading(false);
            return;
          } else {
            // El servidor indica que NO hay turno abierto: purgar inmediatamente cualquier turno local viejo
            await clearOpenCajaSession();
            setOpenCaja(null);
            setLoading(false);
            return;
          }
        } catch (serverErr) {
          console.warn("No se pudo validar el turno con el servidor, usando respaldo local:", serverErr);
        }
      }

      // 2. Si no hay internet o falló la conexión al servidor, recurrir a la sesión local protegida
      const session = await getOpenCajaSession();
      if (session && session.id_turno) {
        setOpenCaja(JSON.stringify(session));
      } else {
        setOpenCaja(null);
      }
    } catch (err) {
      console.error("Error en checkCaja:", err);
      setOpenCaja(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCaja();
  }, [user?.id_usuario, user?.id_sucursal]);

  const handleCajaOpened = () => {
    checkCaja();
  };

  if (loading) return null; // O un spinner

  return (
    <div>
      {openCaja ? <Caja /> : <Bienvenida onCajaOpened={handleCajaOpened} />}
    </div>
  );
}