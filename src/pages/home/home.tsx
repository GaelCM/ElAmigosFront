import Bienvenida from "./bienvenida";
import Caja from "./caja";




export default function Home() {

  const openCaja = localStorage.getItem("openCaja");

  return (
    <div>
      {openCaja ? <Caja /> : <Bienvenida />}
    </div>
  )

}