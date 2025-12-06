import type { CategoriaDTO, CategoriaResponse, CategoriaSingleResponse } from "@/types/Categoria";

const BASE_URL = "http://localhost:3000/api/categorias";

const getHeaders = () => ({
    "Authorization": `Bearer ${localStorage.getItem("tkn")}`,
    "Content-Type": "application/json"
});

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status}`);
    }
    return await res.json();
};

const handleError = (error: any) => {
    if (error instanceof TypeError) {
        throw new Error("No se pudo conectar con el servidor");
    }
    throw new Error(error.message || "Ocurrió un error inesperado");
};

export const obtenerCategoriasApi = async (): Promise<CategoriaResponse> => {
    try {
        const res = await fetch(BASE_URL, {
            method: "GET",
            headers: getHeaders()
        });
        return await handleResponse(res) as CategoriaResponse;
    } catch (error) {
        throw handleError(error);
    }
};

export const obtenerCategoriaApi = async (id: number): Promise<CategoriaSingleResponse> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "GET",
            headers: getHeaders()
        });
        return await handleResponse(res) as CategoriaSingleResponse;
    } catch (error) {
        throw handleError(error);
    }
};

export const insertarCategoriaApi = async (data: CategoriaDTO): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(BASE_URL, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await handleResponse(res);
    } catch (error) {
        throw handleError(error);
    }
};

export const actualizarCategoriaApi = async (id: number, data: CategoriaDTO): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await handleResponse(res);
    } catch (error) {
        throw handleError(error);
    }
};

export const eliminarCategoriaApi = async (id: number): Promise<{ success: boolean, message: string, data: string }> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: "DELETE",
            headers: getHeaders()
        });
        return await handleResponse(res);
    } catch (error) {
        throw handleError(error);
    }
};
