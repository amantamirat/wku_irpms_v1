
import fs from "fs/promises";
import path from "path";

export interface PdfContent {
    text: string;
    pages: number;
    info: any;
}

export class PdfExtractorService {

    async extract(filePath: string): Promise<PdfContent> {
        const buffer = await fs.readFile(filePath);

        const pdfjsLib =
            await import("pdfjs-dist/legacy/build/pdf.mjs");

        const pdfjsDirectory = path.dirname(
            require.resolve("pdfjs-dist/package.json")
        );

        const standardFontDataUrl =
            path.join(pdfjsDirectory, "standard_fonts")
                .replace(/\\/g, "/") + "/";

        const document = await pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            standardFontDataUrl
        }).promise;

        const pages: string[] = [];

        for (
            let pageNumber = 1;
            pageNumber <= document.numPages;
            pageNumber++
        ) {
            const page = await document.getPage(pageNumber);

            const content = await page.getTextContent();

            const pageText = content.items
                .filter(item => "str" in item)
                .map(item => item.str)
                .join(" ");

            pages.push(pageText);
        }

        const metadata = await document.getMetadata();

        return {
            text: pages
                .join("\n")
                .replace(/\r\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .trim(),

            pages: document.numPages,

            info: metadata.info
        };
    }
}
