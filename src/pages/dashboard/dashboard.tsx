import { useEffect, useState } from "react";
import DashboardAdmon from "./components/dashboardAdmon";
import DashboardUser from "./components/dashboardUser";
import NoTurnoError from "./components/noTurnoError";
import { useCurrentUser } from "@/contexts/currentUser";


export default function DashboardPage() {
    const { user } = useCurrentUser()
    const [turnoId, setTurnoId] = useState<number | null>(null);

    useEffect(() => {
        const checkTurno = async () => {
            // @ts-ignore
            const api = window["electron-api"];
            const storeCaja = await api?.getConfig("open_caja");
            const turnoDataString = localStorage.getItem("openCaja");

            const data = storeCaja || (turnoDataString ? JSON.parse(turnoDataString) : null);

            if (data && data.id_turno) {
                setTurnoId(data.id_turno);
            }
        };
        checkTurno();
    }, []);

    if (!turnoId && user.id_rol == 1) {
        return <DashboardAdmon />;
    }

    if (!turnoId) {
        return <NoTurnoError />;
    }

    return (
        <div>
            {turnoId && user.id_rol == 1 ? <DashboardAdmon /> : <DashboardUser idTurno={turnoId} />}
        </div>
    )
}