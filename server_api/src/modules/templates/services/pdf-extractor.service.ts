import fs from "fs/promises";
import pdf from "pdf-parse";

export interface PdfContent {
    text: string;
    pages: number;
    info: any;
}

export class PdfExtractorService {

    async extract(filePath: string): Promise<PdfContent> {

        const buffer = await fs.readFile(filePath);

        const result = await pdf(buffer);

        return {
            text: result.text
                .replace(/\r\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .trim(),

            pages: result.numpages,        

            info: result.info
        };
    }

}