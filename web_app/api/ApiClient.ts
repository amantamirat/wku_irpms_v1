import { useAuth } from "@/contexts/auth-context";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// const { logout } = useAuth();
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('authToken');
    }
    return null;
};

const handleError = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log("Error Data:", errorData); 
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response;
};

export const ApiClient = {
    async get(endpoint: string): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            cache: 'no-store',
        });

        await handleError(response);
        const result = await response.json();
        return result.data; 
    },

    async post(endpoint: string, payload: any): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify(payload),
        });

        await handleError(response);
        const result = await response.json();
        return result.data; 
    },

    async put(endpoint: string, payload?: any): Promise<any> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: payload ? JSON.stringify(payload) : undefined,
        });

        await handleError(response);
        const result = await response.json();
        return result.data; 
    },

    async delete(endpoint: string): Promise<boolean> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        });

        await handleError(response);
        const result = await response.json();
        return result.data; 
    }
};