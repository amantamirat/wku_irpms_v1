import fs from "fs/promises";

export interface PdfTextItem {
    text: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export class PdfLayoutExtractorService {

    async extract(filePath: string): Promise<PdfTextItem[]> {

        const buffer = await fs.readFile(filePath);

        const pdfjsLib =
            await import("pdfjs-dist/legacy/build/pdf.mjs");

        const pdf =
            await pdfjsLib.getDocument({
                data: new Uint8Array(buffer)
            }).promise;

        const items: PdfTextItem[] = [];

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(pageNumber);

            const content =
                await page.getTextContent();

            for (const item of content.items) {

                if (!("str" in item) || !item.str.trim()) {
                    continue;
                }

                const transform = item.transform;

                const text =
                    item.str;

                const totalWidth =
                    item.width;

                const totalLength =
                    text.length;

                const wordRegex =
                    /\S+/g;

                let match: RegExpExecArray | null;

                while (
                    (match = wordRegex.exec(text)) !== null
                ) {

                    const word =
                        match[0];

                    const start =
                        match.index;

                    const end =
                        start + word.length;

                    /*
                     * Estimate word position based on
                     * its character position inside the
                     * original PDF.js text item.
                     */
                    const x =
                        transform[4] +
                        totalWidth *
                        (start / totalLength);

                    const width =
                        totalWidth *
                        (word.length / totalLength);

                    items.push({
                        text: word,
                        page: pageNumber,

                        x,
                        y: transform[5],

                        width,
                        height: item.height
                    });
                }
            }
        }

        return items;
    }
}