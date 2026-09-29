import { Request, Response, NextFunction } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";

import { settingService } from "../../core/container";
import { SettingKey } from "../../modules/settings/setting.model";
import { AppError } from "../errors/app.error";
import { ERROR_CODES } from "../errors/error.codes";


const TEMP_DIR = path.join(process.cwd(), "uploads", "temp");

/*
 * Multer only auto-creates the destination when it is a string.
 * Since we use a function, create the folder once at startup.
 */
fs.mkdirSync(TEMP_DIR, { recursive: true });


const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, TEMP_DIR);
    },

    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname);

        cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
        );
    },
});


export const upload = {

    single(
        fieldName: string,
        allowedMimeTypes?: string[]
    ) {

        return async (
            req: Request,
            res: Response,
            next: NextFunction
        ) => {

            try {

                // Maximum upload size from system settings
                const maxSizeMB =
                    await settingService.getSettingValue<number>(
                        SettingKey.MAX_FILE_UPLOAD_SIZE_MB,
                        10
                    );


                // Globally allowed MIME types from system settings
                const globalAllowedMimeTypes =
                    await settingService.getSettingValue<string[]>(
                        SettingKey.ALLOWED_FILE_TYPES,
                        []
                    );


                /*
                 * If the route specifies allowedMimeTypes,
                 * use those types.
                 *
                 * Otherwise use the global setting.
                 */
                const effectiveMimeTypes =
                    allowedMimeTypes ??
                    globalAllowedMimeTypes;


                const middleware = multer({

                    storage,

                    /*
                     * Multer handles the size limit while
                     * receiving the upload.
                     */
                    limits: {
                        fileSize: Number(maxSizeMB) * 1024 * 1024,
                        files: 1,
                    },


                    /*
                     * Validate MIME type.
                     */
                    fileFilter: (_req, file, cb) => {

                        if (
                            effectiveMimeTypes.length > 0 &&
                            !effectiveMimeTypes.includes(file.mimetype)
                        ) {
                            return cb(
                                new AppError(ERROR_CODES.INVALID_FILE_FORMAT)
                            );
                        }

                        cb(null, true);
                    },

                }).single(fieldName);


                /*
                 * Execute Multer.
                 *
                 * Multer does not throw LIMIT_FILE_SIZE
                 * synchronously. It passes the error to
                 * this callback.
                 */
                middleware(req, res, (error) => {

                    /*
                     * Upload succeeded.
                     */
                    if (!error) {

                        /*
                         * Safety net: once the response is finished,
                         * remove the temp file if it is still there.
                         *
                         * - If the service moved it, unlink finds nothing
                         *   (ENOENT) and the error is ignored.
                         * - If a later middleware/controller failed and the
                         *   file was never moved, it is cleaned up here.
                         */
                        const tempPath = req.file?.path;

                        if (tempPath) {
                            res.on("close", () => {
                                fs.promises
                                    .unlink(tempPath)
                                    .catch((err: NodeJS.ErrnoException) => {
                                        if (err.code !== "ENOENT") {
                                            console.error(
                                                `Failed to clean temp file ${tempPath}:`,
                                                err
                                            );
                                        }
                                    });
                            });
                        }

                        return next();
                    }


                    /*
                     * File is larger than the configured
                     * maximum size.
                     */
                    if (
                        error instanceof multer.MulterError &&
                        error.code === "LIMIT_FILE_SIZE"
                    ) {
                        return next(
                            new AppError(ERROR_CODES.FILE_TOO_LARGE)
                        );
                    }


                    /*
                     * Any other Multer or upload error.
                     * (Multer already removes partial files itself.)
                     */
                    return next(error);
                });

            } catch (error) {

                /*
                 * Errors while reading settings or creating
                 * the upload middleware.
                 */
                return next(error);
            }
        };
    },
};