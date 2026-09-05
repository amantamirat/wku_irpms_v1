import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../modules/auth/auth.middleware';
import { errorResponse } from '../helpers/response';
import { AuthPermissionService } from '../../modules/auth/auth.permission-service';
import { ERROR_CODES } from '../errors/error.codes';


export const createCheckPermission = (authPermissionService: AuthPermissionService) => {
    return (requiredPermission: string | string[]) => {
        return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
            try {
                if (!req.auth) {
                    return errorResponse(res, 401, ERROR_CODES.UNAUTHORIZED);
                }
                const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
                const userPermissions = await authPermissionService.getUserPermissions(req.auth.userId);
                const hasPermission = permissions.some(permission => userPermissions.includes(permission));
                if (!hasPermission) {
                    return errorResponse(res, 403, `Forbidden. Missing permission: ${permissions.join(", ")}`);
                }
                next();

            } catch (error) {
                console.error("Permission check failed:", error);
                return errorResponse(res, 500, "Internal server error during permission check.");
            }
        };
    };
};


export const createCheckTransitionPermission = (
    checkPermission: (permission: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> | void
) => {
    return (resource: string) => {
        return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
            const { current, next: nextStatus } = req.body;

            if (!current || !nextStatus) {
                return errorResponse(res, 400, "Transition requires 'current' and 'next' status");
            }
            const permission = `${resource}:transition.${current}.${nextStatus}`;
            return checkPermission(permission)(req, res, next);
        };
    };
};
