import { useCurrentUser } from "@/contexts/currentUser";
import TransAdmin from "./transAdmin";
import TransUser from "./transUser";


export default function NuevaTransferenciaPage(){

    const {user}=useCurrentUser();
    
    if(!user){
            return <div>error</div>
    }
    
    return(
        <div>
            {user.id_rol===1 ? (
                            <TransAdmin></TransAdmin>
                        ):(
                            <TransUser></TransUser>
            )}
        </div>
    )
}