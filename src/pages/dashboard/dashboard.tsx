import { useEffect, useState } from "react";
import DashboardAdmon from "./components/dashboardAdmon";
import DashboardUser from "./components/dashboardUser";
import NoTurnoError from "./components/noTurnoError";
import { useCurrentUser } from "@/contexts/currentUser";
import { getOpenCajaSession } from "@/utils/cajaSession";


export default function DashboardPage() {
    const { user } = useCurrentUser()
    const [turnoId, setTurnoId] = useState<number | null>(null);

    useEffect(() => {
        const checkTurno = async () => {
            const session = await getOpenCajaSession();
            if (session && session.id_turno) {
                setTurnoId(session.id_turno);
            } else {
                setTurnoId(null);
            }
        };
        checkTurno();
    }, []);

    if (!turnoId && (user.id_rol === 1 || user.id_rol === 3)) {
        return <DashboardAdmon filterSucursalId={user.id_rol === 3 ? user.id_sucursal : undefined} />;
    }

    if (!turnoId) {
        return <NoTurnoError />;
    }

    return (
        <div>
            {turnoId && (user.id_rol === 1 || user.id_rol === 3) ? <DashboardAdmon filterSucursalId={user.id_rol === 3 ? user.id_sucursal : undefined} /> : <DashboardUser idTurno={turnoId} />}
        </div>
    )
}