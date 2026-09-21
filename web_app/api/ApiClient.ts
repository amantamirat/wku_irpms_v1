import { AuthApi } from "@/app/(full-page)/auth/api/auth.api";
import { ApiError } from "./ApiError";
import { extractId } from "@/utils/utils";
import { ERROR_CODES } from "./error.codes";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Get authentication token from the client.
 */
const getAuthToken = (): string | null => {
    if (typeof window !== "undefined") {
        return AuthApi.getToken();
    }

    return null;
};


const handleError = async (
    response: Response
): Promise<Response> => {
    if (response.ok) {
        return response;
    }

    let errorData: {
        success?: boolean;
        message: string;
        errorName: string;
        errorCode?: string;
        errorMessage: string;
        errorDetail?: unknown;
        error?: unknown;
    } | null = null;

    try {
        errorData = await response.json();
        //console.log(errorData);
    } catch (error) {
        console.log("[ApiClient] Failed to parse error response:", error);
    }

    const errorName = errorData?.errorName;
    const errorMessage = errorData?.errorMessage;
    if (errorName === "AppError") {
        const errorCode = errorData?.errorCode;

        //console.log(JSON.stringify(errorData));
        /**
         * * Token is no longer usable.
         * */
        if (
            //response.status === 401 &&
            [
                ERROR_CODES.TOKEN_MISSING,
                ERROR_CODES.TOKEN_EXPIRED,
                ERROR_CODES.TOKEN_INVALID,
            ].includes(errorCode as any)
        ) {
            AuthApi.logout();
        }

        throw new ApiError(errorMessage ?? "Request Failed", {
            code: errorCode,
            status: response.status,
            details: errorData?.errorDetail
        });
    }

    throw new ApiError(errorMessage ?? "Unknown Error");
    //const errorDetails = errorData?.details ?? errorData?.error;
};

/**
 * Normalize any unknown error into ApiError.
 *
 * Existing ApiError instances are returned unchanged.
 * Network/fetch/unexpected errors are converted into
 * SERVER_UNREACHABLE.
 */
const normalizeError = (
    error: unknown
): ApiError => {
    if (error instanceof ApiError) {
        return error;
    }

    return new ApiError(
        "Unable to connect to the server. Please check your internet connection or try again later.",
        {
            code: "SERVER_UNREACHABLE",
            status: 0,
            details:
                error instanceof Error
                    ? error.message
                    : String(error),
        }
    );
};

/**
 * Safely parse a successful API response.
 *
 * Supports:
 *
 * {
 *     success: true,
 *     data: {...}
 * }
 *
 * and:
 *
 * {
 *     success: true,
 *     data: [...]
 * }
 *
 * Also safely handles HTTP 204 No Content.
 */
const parseResponse = async <T>(
    response: Response
): Promise<T> => {
    if (response.status === 204) {
        return undefined as T;
    }

    const result = await response
        .json()
        .catch(() => ({}));

    return (result?.data ?? result) as T;
};

export const ApiClient = {

    /**
     * GET
     */
    async get<T = any>(
        endpoint: string,
        params?: Record<string, any>
    ): Promise<T> {
        let url = `${BASE_URL}${endpoint}`;

        if (params) {
            const searchParams =
                new URLSearchParams();

            Object.entries(params).forEach(
                ([key, rawValue]) => {
                    if (rawValue instanceof Date) {
                        searchParams.append(
                            key,
                            rawValue.toISOString()
                        );

                        return;
                    }

                    const value =
                        extractId(rawValue);

                    if (
                        value !== undefined &&
                        value !== null &&
                        value !== ""
                    ) {
                        searchParams.append(
                            key,
                            String(value)
                        );
                    }
                }
            );

            const queryString =
                searchParams.toString();

            if (queryString) {
                url +=
                    (url.includes("?")
                        ? "&"
                        : "?") +
                    queryString;
            }
        }

        const token = getAuthToken();

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type":
                        "application/json",

                    ...(token && {
                        Authorization:
                            `Bearer ${token}`,
                    }),
                },
                cache: "no-store",
            });

            await handleError(response);

            return await parseResponse<T>(
                response
            );
        } catch (error) {
            console.log(
                "[ApiClient.get] Error:",
                error
            );

            throw normalizeError(error);
        }
    },

    /**
     * POST
     */
    async post<T = any>(
        endpoint: string,
        payload?: any
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const isFormData =
            typeof FormData !== "undefined" &&
            payload instanceof FormData;

        try {
            const response = await fetch(url, {
                method: "POST",

                headers: {
                    ...(token && {
                        Authorization:
                            `Bearer ${token}`,
                    }),

                    /**
                     * Do not manually set Content-Type
                     * for FormData.
                     *
                     * The browser automatically adds
                     * the multipart boundary.
                     */
                    ...(!isFormData && {
                        "Content-Type":
                            "application/json",
                    }),
                },

                body: isFormData
                    ? payload
                    : payload !== undefined
                        ? JSON.stringify(payload)
                        : undefined,
            });

            await handleError(response);

            return await parseResponse<T>(
                response
            );
        } catch (error) {
            console.log(
                "[ApiClient.post] Error:",
                error
            );

            throw normalizeError(error);
        }
    },

    /**
     * PUT
     */
    async put<T = any>(
        endpoint: string,
        payload?: any
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const isFormData =
            typeof FormData !== "undefined" &&
            payload instanceof FormData;

        try {
            const response = await fetch(url, {
                method: "PUT",

                headers: {
                    ...(token && {
                        Authorization:
                            `Bearer ${token}`,
                    }),

                    ...(!isFormData && {
                        "Content-Type":
                            "application/json",
                    }),
                },

                body: isFormData
                    ? payload
                    : payload !== undefined
                        ? JSON.stringify(payload)
                        : undefined,
            });

            await handleError(response);

            return await parseResponse<T>(
                response
            );
        } catch (error) {
            console.log(
                "[ApiClient.put] Error:",
                error
            );

            throw normalizeError(error);
        }
    },

    /**
     * PATCH
     */
    async patch<T = any>(
        endpoint: string,
        payload?: any
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const isFormData =
            typeof FormData !== "undefined" &&
            payload instanceof FormData;

        try {
            const response = await fetch(url, {
                method: "PATCH",

                headers: {
                    ...(token && {
                        Authorization:
                            `Bearer ${token}`,
                    }),

                    ...(!isFormData && {
                        "Content-Type":
                            "application/json",
                    }),
                },

                body: isFormData
                    ? payload
                    : payload !== undefined
                        ? JSON.stringify(payload)
                        : undefined,
            });

            await handleError(response);

            return await parseResponse<T>(
                response
            );
        } catch (error) {
            console.log(
                "[ApiClient.patch] Error:",
                error
            );

            throw normalizeError(error);
        }
    },

    /**
     * DELETE
     */
    async delete<T = any>(
        endpoint: string,
        payload?: any
    ): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const isFormData =
            typeof FormData !== "undefined" &&
            payload instanceof FormData;

        try {
            const response = await fetch(url, {
                method: "DELETE",

                headers: {
                    ...(token && {
                        Authorization:
                            `Bearer ${token}`,
                    }),

                    ...(!isFormData && {
                        "Content-Type":
                            "application/json",
                    }),
                },

                body: isFormData
                    ? payload
                    : payload !== undefined
                        ? JSON.stringify(payload)
                        : undefined,
            });

            await handleError(response);

            return await parseResponse<T>(
                response
            );
        } catch (error) {
            console.log(
                "[ApiClient.delete] Error:",
                error
            );

            throw normalizeError(error);
        }
    },
};
