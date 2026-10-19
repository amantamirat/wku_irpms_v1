import fs from "fs/promises";
import sharp from "sharp";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { pdf } from "pdf-to-img";
import { AnonymizationEntity } from "./anonymizer.types";

export class SecurePdfRedactorService {

    private readonly paddingX = 3;
    private readonly paddingY = 2;

    async redactToImage(
        inputPath: string,
        outputPath: string,
        entities: AnonymizationEntity[]
    ): Promise<void> {

        const originalPdf = await PDFDocument.load(await fs.readFile(inputPath));
        const document = await pdf(inputPath, { scale: 2.0 });
        const newPdf = await PDFDocument.create();
        const font = await newPdf.embedFont(StandardFonts.HelveticaBold);

        let pageNum = 1;

        for await (const pageImage of document) {
            const originalPage = originalPdf.getPage(pageNum - 1);
            const pageWidth = originalPage.getWidth();
            const pageHeight = originalPage.getHeight();

            // 1. Burn black boxes INTO the pixels first
            const safePng = await this.burnRedactions(
                Buffer.from(pageImage),
                pageNum,
                pageWidth,
                pageHeight,
                entities
            );

            // 2. Only the already-redacted image is embedded
            const image = await newPdf.embedPng(safePng);
            const newPage = newPdf.addPage([pageWidth, pageHeight]);
            newPage.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });

            // 3. Draw replacement text on top (safe: it's not the original value)
            for (const entity of entities) {
                if (!entity.replacement) continue;
                for (const loc of entity.locations) {
                    if (loc.page !== pageNum) continue;
                    this.drawReplacementText(newPage, font, loc, entity.replacement);
                }
            }

            pageNum++;
        }

        await fs.writeFile(outputPath, await newPdf.save());
    }

    /**
     * Draws opaque black rectangles directly into the PNG pixels.
     * After this, the original text no longer exists in the image.
     */
    private async burnRedactions(
        png: Buffer,
        pageNum: number,
        pageWidth: number,
        pageHeight: number,
        entities: AnonymizationEntity[]
    ): Promise<Buffer> {

        const meta = await sharp(png).metadata();
        const imgW = meta.width!;
        const imgH = meta.height!;

        // Use the real ratio between image pixels and PDF points
        const sx = imgW / pageWidth;
        const sy = imgH / pageHeight;

        const rects: string[] = [];

        for (const entity of entities) {
            for (const loc of entity.locations) {
                if (loc.page !== pageNum) continue;

                // PDF points (bottom-left origin) -> image pixels (top-left origin)
                const left = (loc.x - this.paddingX) * sx;
                const top =
                    (pageHeight - (loc.y + loc.height + this.paddingY)) * sy;
                const w = (loc.width + this.paddingX * 2) * sx;
                const h = (loc.height + this.paddingY * 2) * sy;

                // Slight extra bleed so anti-aliased edges don't leave remnants
                const bleed = 1;
                rects.push(
                    `<rect x="${Math.floor(left) - bleed}" y="${Math.floor(top) - bleed}" ` +
                    `width="${Math.ceil(w) + bleed * 2}" height="${Math.ceil(h) + bleed * 2}" fill="#000"/>`
                );
            }
        }

        if (rects.length === 0) return png;

        const svg =
            `<svg width="${imgW}" height="${imgH}" xmlns="http://www.w3.org/2000/svg">` +
            rects.join("") +
            `</svg>`;

        return sharp(png)
            .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
            .png()
            .toBuffer();
    }

    private drawReplacementText(
        page: PDFPage,
        font: PDFFont,
        loc: { x: number; y: number; width: number; height: number },
        text: string
    ): void {
        const boxX = loc.x - this.paddingX;
        const boxY = loc.y - this.paddingY;
        const boxW = loc.width + this.paddingX * 2;
        const boxH = loc.height + this.paddingY * 2;

        const { text: fitted, size } = this.fitText(font, text, boxW - 4, boxH - 2);

        const textWidth = font.widthOfTextAtSize(fitted, size);
        const capHeight = font.heightAtSize(size, { descender: false });

        page.drawText(fitted, {
            x: boxX + (boxW - textWidth) / 2,
            y: boxY + (boxH - capHeight) / 2,
            size,
            font,
            color: rgb(1, 1, 1)
        });
    }

    // fitText() stays exactly as in my previous answer
    private fitText(
        font: PDFFont, text: string, maxWidth: number, maxHeight: number,
        minSize = 4, maxSize = 14
    ): { text: string; size: number } {
        let size = Math.min(maxSize, maxHeight / 0.72);
        while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25;
        size = Math.max(size, minSize);
        if (font.widthOfTextAtSize(text, size) > maxWidth) {
            let t = text;
            while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > maxWidth) t = t.slice(0, -1);
            return { text: t + "…", size };
        }
        return { text, size };
    }
}