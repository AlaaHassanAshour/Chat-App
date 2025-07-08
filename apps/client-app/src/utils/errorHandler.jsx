import { AUTH_CONFIG } from "@config/env";
import { notification } from "./InitAntStaticApi";

/**
 * Error codes and their corresponding messages
 */
export const ERROR_CODES = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    NETWORK_ERROR: "NETWORK_ERROR", // tested
    TIMEOUT_ERROR: "TIMEOUT_ERROR",
};

/**
 * Default error messages for different scenarios
 */
const DEFAULT_MESSAGES = {
    [ERROR_CODES.UNAUTHORIZED]: "Your session has expired. Please login again.",
    [ERROR_CODES.FORBIDDEN]:
        "You do not have permission to perform this action.",
    [ERROR_CODES.NOT_FOUND]: "The requested resource was not found.",
    [ERROR_CODES.VALIDATION_ERROR]: "Please check your input and try again.",
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: "An internal server error occurred.",
    [ERROR_CODES.SERVICE_UNAVAILABLE]: "The service is currently unavailable.",
    [ERROR_CODES.NETWORK_ERROR]:
        "Unable to connect to the server. Please check your internet connection.",
    [ERROR_CODES.TIMEOUT_ERROR]: "The request timed out. Please try again.",
    DEFAULT: "An unexpected error occurred.",
};

/**
 * Handles API errors consistently across the application
 * @param {Error} error - The error object from axios
 * @param {Object} options - Additional options for error handling
 * @param {string} options.notificationDuration - Duration of the notification in seconds
 * @returns {Object} Formatted error object
 */
export const handleApiError = (
    error,
    options = { showNotification: true, notificationDuration: 5 }
) => {
    let errorResponse = {
        status: error.response?.status,
        message:
            error.response?.data?.error?.message ||
            error.response?.data?.message ||
            error.message,
        data: error.response?.data,
        type: "error",
    };

    // Handle network errors
    if (!error.response) {
        if (error.code === "ECONNABORTED") {
            errorResponse = {
                ...errorResponse,
                status: ERROR_CODES.TIMEOUT_ERROR,
                message: DEFAULT_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
            };
        } else {
            errorResponse = {
                ...errorResponse,
                status: ERROR_CODES.NETWORK_ERROR,
                message: DEFAULT_MESSAGES[ERROR_CODES.NETWORK_ERROR],
            };
        }
    }

    // Get default message if none provided
    if (!errorResponse.message) {
        errorResponse.message =
            DEFAULT_MESSAGES[errorResponse.status] || DEFAULT_MESSAGES.DEFAULT;
    }

    // Handle specific error codes
    switch (errorResponse.status) {
        case ERROR_CODES.UNAUTHORIZED:
            localStorage.removeItem(AUTH_CONFIG.tokenKey);
            // Only redirect if we're not already on the login page
            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
            break;

        case ERROR_CODES.VALIDATION_ERROR:
            // Format validation errors if available
            if (errorResponse.data?.errors) {
                errorResponse.validationErrors = errorResponse.data.errors;
                errorResponse.message = Object.values(errorResponse.data.errors)
                    .flat()
                    .join(", ");
            }
            break;

        case ERROR_CODES.FORBIDDEN:
            errorResponse = {
                ...errorResponse,
                status: ERROR_CODES.FORBIDDEN,
                message:
                    errorResponse.message ||
                    DEFAULT_MESSAGES[ERROR_CODES.FORBIDDEN],
            };
            break;

        default:
            // Log unexpected errors
            if (errorResponse.status >= 500) {
                console.error("Server Error:", errorResponse);
            }
    }

    // Show notification if enabled
    if (options.showNotification) {
        notification.error({
            message: "Error",
            description: (
                <div style={{ whiteSpace: "pre-line" }}>
                    {errorResponse.message}
                </div>
            ),
            duration: 5,
        });
    }

    return errorResponse;
};
