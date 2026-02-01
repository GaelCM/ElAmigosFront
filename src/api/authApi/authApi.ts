import type { AuthResponse } from "@/types/Auth";


export const iniciarSesionApi = async (usuario: string, password: string): Promise<AuthResponse> => {
    const response = await fetch('https://elamigos-elamigosapi.xj7zln.easypanel.host/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, password })
    });

    const data = await response.json();
    return data as AuthResponse;


}

export const checkPasswordApi = async (id_usuario: number, password: string): Promise<{ success: boolean, message: string }> => {
    const response = await fetch('https://elamigos-elamigosapi.xj7zln.easypanel.host/api/auth/checkPassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_usuario, password })
    });

    const data = await response.json();
    return data as { success: boolean, message: string };
}