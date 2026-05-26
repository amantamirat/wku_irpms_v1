import fs from "fs";
import path from "path";
import multer from "multer";

// ✅ CRITICAL FIX: Use process.cwd() to target the root uploads directory
const baseUploadDir = path.join(process.cwd(), "uploads"); 

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const subFolder = (req.headers["x-upload-folder"] as string) || "general";
        const targetDir = path.join(baseUploadDir, subFolder);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ storage });