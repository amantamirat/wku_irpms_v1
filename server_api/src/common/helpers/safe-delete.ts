import fs from "fs";
import path from "path";

export default function safeDeleteFile(filePath?: string) {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Failed to delete file:", err);
  }
}
