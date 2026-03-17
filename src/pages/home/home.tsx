import Bienvenida from "./bienvenida";
import Caja from "./caja";
import { useState, useEffect } from "react";




export default function Home() {
  const [openCaja, setOpenCaja] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkCaja = async () => {
    // @ts-ignore
    const api = window["electron-api"];
    const storeCaja = await api?.getConfig("open_caja");

    if (storeCaja) {
      setOpenCaja(JSON.stringify(storeCaja));
    } else {
      // Fallback to localStorage if electron-store doesn't have it
      const localCaja = localStorage.getItem("openCaja");
      if (localCaja) {
        setOpenCaja(localCaja);
      } else {
        setOpenCaja(null);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    checkCaja();
  }, []);

  const handleCajaOpened = () => {
    checkCaja();
  };

  if (loading) return null; // O un spinner

  return (
    <div>
      {openCaja ? <Caja /> : <Bienvenida onCajaOpened={handleCajaOpened} />}
    </div>
  )

}