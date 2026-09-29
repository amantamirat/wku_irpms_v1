import fs from "fs/promises";
import path from "path";

export class FileStorageService {
    private readonly uploadRoot = path.join(process.cwd(), "uploads");

    /**
     * Moves a file into uploads/<destinationFolder>/<filename>.
     * Returns the path relative to the upload root (store this in your DB).
     * If anything fails, both the partial destination file and the
     * source (temp) file are cleaned up before the error is rethrown.
     */
    async move(
        sourcePath: string,
        destinationFolder: string,
        filename: string
    ): Promise<string> {
        const destinationDir = this.resolveInsideRoot(destinationFolder);
        const destinationPath = path.join(destinationDir, path.basename(filename));

        try {
            await fs.mkdir(destinationDir, { recursive: true });

            try {
                await fs.rename(sourcePath, destinationPath);
            } catch (error: any) {
                // rename can't cross drives/filesystems, so fall back to copy + delete
                if (error.code !== "EXDEV") throw error;

                await fs.copyFile(sourcePath, destinationPath);
                await fs.unlink(sourcePath);
            }

            return path.relative(this.uploadRoot, destinationPath).split(path.sep)
                .join("/");
        } catch (error) {
            // Roll back: remove any partial destination file and the source file
            await this.safeUnlink(destinationPath);
            await this.safeUnlink(sourcePath);
            throw error;
        }
    }

    /**
     * Deletes a file by its path relative to the upload root
     * (the same value returned by move()). Missing files are ignored.
     */
    async delete(relativePath: string): Promise<void> {
        const absolutePath = this.resolveInsideRoot(relativePath);
        await this.safeUnlink(absolutePath);
    }

    /**
     * Unlink that doesn't throw if the file is already gone.
     */
    private async safeUnlink(absolutePath: string): Promise<void> {
        try {
            await fs.unlink(absolutePath);
        } catch (error: any) {
            if (error.code === "ENOENT") return;
            throw error;
        }
    }

    /**
     * Resolves a relative path against the upload root and makes sure
     * the result can't escape it (blocks "../" path traversal).
     */
    private resolveInsideRoot(relativePath: string): string {
        const resolved = path.resolve(this.uploadRoot, relativePath);

        if (
            resolved !== this.uploadRoot &&
            !resolved.startsWith(this.uploadRoot + path.sep)
        ) {
            throw new Error("Invalid path: outside of upload directory");
        }

        return resolved;
    }

    /**
 * Stored path -> absolute path. Use this everywhere a stored
 * documentPath is read.
 */
    resolve(storedPath: string): string {
        // Legacy rows were stored as "uploads/xyz.pdf" (relative to cwd)
        const normalized = storedPath
            .replace(/\\/g, "/")
            .replace(/^uploads\//, "");

        return this.resolveInsideRoot(normalized);
    }

    async read(storedPath: string): Promise<Buffer> {
        return fs.readFile(this.resolve(storedPath));
    }

    /**
 * Absolute path -> stored path (relative to upload root, forward slashes).
 */
    toStoredPath(absolutePath: string): string {
        const resolved = path.resolve(absolutePath);

        if (!resolved.startsWith(this.uploadRoot + path.sep)) {
            throw new Error("Invalid path: outside of upload directory");
        }

        return path.relative(this.uploadRoot, resolved).split(path.sep).join("/");
    }

    /**
 * Removes a leftover temp file (absolute path, e.g. multer's req.file.path).
 * Safe to call even if the file was already moved or deleted.
 */
    async discardTemp(absolutePath: string): Promise<void> {
        await this.safeUnlink(absolutePath);
    }
}