import { NextFunction, Request, Response } from 'express';
import { AuthenticatedRequest } from '../../modules/auth/auth.middleware';
import { errorResponse } from '../helpers/response';
import { AuthPermissionService } from '../../modules/auth/auth.permission-service';
import { ERROR_CODES } from '../errors/error.codes';
import { AppError } from '../errors/app.error';

export const createCheckPermission = (
    authPermissionService: AuthPermissionService
) => {
    return (requiredPermission: string | string[]) => {
        return async (
            req: AuthenticatedRequest,
            res: Response,
            next: NextFunction
        ) => {
            if (!req.auth) {
                return errorResponse(
                    res,
                    401,
                    'Authentication required.',
                    new AppError(ERROR_CODES.UNAUTHORIZED)
                );
            }

            const hasPermission =
                await authPermissionService.hasPermission(
                    req.auth.userId,
                    requiredPermission
                );

            if (!hasPermission) {
                const permissions = Array.isArray(requiredPermission)
                    ? requiredPermission
                    : [requiredPermission];

                return errorResponse(
                    res,
                    403,
                    `Forbidden. Missing permission: ${permissions.join(', ')}`,
                    new AppError(ERROR_CODES.FORBIDDEN)
                );
            }

            next();
        };
    };
};


export const createCheckTransitionPermission = (
    checkPermission: (
        permission: string | string[]
    ) => (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => Promise<void> | void
) => {
    return (resource: string) => {
        return (
            req: AuthenticatedRequest,
            res: Response,
            next: NextFunction
        ) => {
            const { current, next: nextStatus } = req.body;

            if (!current || !nextStatus) {
                return errorResponse(
                    res,
                    400,
                    "Transition requires 'current' and 'next' status",
                    new AppError(ERROR_CODES.INVALID_TRANSITION)
                );
            }

            const permission =
                `${resource}:transition.${current}.${nextStatus}`;

            return checkPermission(permission)(req, res, next);
        };
    };
};