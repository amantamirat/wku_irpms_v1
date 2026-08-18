import fs from "fs/promises";
import { PDFDocument, rgb } from "pdf-lib";
import { pdf } from "pdf-to-img";

import {
    AnonymizationEntity
} from "./anonymizer.types";

export class SecurePdfRedactorService {

    async redactToImage(
        inputPath: string,
        outputPath: string,
        entities: AnonymizationEntity[]
    ): Promise<void> {

        /*
         * Load original PDF so we can preserve
         * the original page dimensions.
         */
        const originalBuffer =
            await fs.readFile(inputPath);

        const originalPdf =
            await PDFDocument.load(originalBuffer);

        /*
         * Render PDF at higher resolution.
         *
         * 2.0 = good balance
         * 3.0 = higher quality
         * 4.0 = very high quality / larger file
         */
        const scale = 2.0;

        const document =
            await pdf(inputPath, {
                scale
            });

        const newPdf =
            await PDFDocument.create();

        let pageNum = 1;

        for await (const pageImage of document) {

            /*
             * Original PDF page dimensions.
             *
             * These are in PDF points, which are the same
             * coordinate system used by your PdfLayoutExtractor.
             */
            const originalPage =
                originalPdf.getPage(pageNum - 1);

            const pageWidth =
                originalPage.getWidth();

            const pageHeight =
                originalPage.getHeight();

            /*
             * Embed high-resolution rendered page.
             */
            const image =
                await newPdf.embedPng(
                    pageImage
                );

            /*
             * IMPORTANT:
             *
             * Keep the PDF page in the ORIGINAL
             * coordinate system.
             */
            const newPage =
                newPdf.addPage([
                    pageWidth,
                    pageHeight
                ]);

            /*
             * Draw the high-resolution image over
             * the entire original PDF page.
             *
             * The image is scaled DOWN to the original
             * PDF dimensions, preserving the high-resolution
             * raster internally.
             */
            newPage.drawImage(image, {
                x: 0,
                y: 0,
                width: pageWidth,
                height: pageHeight
            });

            /*
             * Redact entities using the ORIGINAL
             * PDF coordinates.
             */
            for (const entity of entities) {

                for (const location of entity.locations) {

                    if (location.page !== pageNum) {
                        continue;
                    }

                    const paddingX = 3;
                    const paddingY = 2;

                    newPage.drawRectangle({
                        x: location.x - paddingX,
                        y: location.y - paddingY,
                        width: location.width + paddingX * 2,
                        height: location.height + paddingY * 2,
                        color: rgb(0, 0, 0)
                    });
                }
            }

            pageNum++;
        }

        const pdfBytes =
            await newPdf.save();

        await fs.writeFile(
            outputPath,
            pdfBytes
        );
    }
}