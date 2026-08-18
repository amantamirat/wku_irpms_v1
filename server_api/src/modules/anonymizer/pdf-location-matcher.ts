import {
    AnonymizationEntityType
} from "./anonymizer.types";

import {
    PdfTextItem
} from "./pdf-layout-extractor.service";

export interface PdfTextLocation {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

export class PdfEntityLocationMatcher {

    findLocations(
        detectedText: string,
        items: PdfTextItem[],
        type: AnonymizationEntityType
    ): PdfTextLocation[] {

        const target =
            this.normalize(detectedText, type);

        if (!target) {
            return [];
        }

        // Normal matching
        const locations =
            items
                .filter(item => {

                    const text =
                        this.normalize(item.text, type);

                    if (
                        type ===
                        AnonymizationEntityType.MEMBER
                    ) {
                        return text === target;
                    }

                    return text.includes(target);
                })
                .map(item => ({
                    page: item.page,
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                }));

        if (locations.length > 0) {
            return locations;
        }

        /*
         * Phone numbers can be split by PDF.js:
         *
         * +251 | 911 | 234 | 567
         *
         * Match each piece separately.
         */
        if (
            type ===
            AnonymizationEntityType.PHONE
        ) {

            const parts =
                detectedText
                    .split(/[\s-]+/)
                    .filter(Boolean);

            const phoneLocations: PdfTextLocation[] = [];

            for (const part of parts) {

                const normalizedPart =
                    this.normalize(
                        part,
                        AnonymizationEntityType.PHONE
                    );

                if (!normalizedPart) {
                    continue;
                }

                for (const item of items) {

                    const itemText =
                        this.normalize(
                            item.text,
                            AnonymizationEntityType.PHONE
                        );

                    if (
                        itemText ===
                        normalizedPart
                    ) {

                        phoneLocations.push({
                            page: item.page,
                            x: item.x,
                            y: item.y,
                            width: item.width,
                            height: item.height
                        });
                    }
                }
            }

            return phoneLocations;
        }

        return [];
    }


    private normalize(
        text: string,
        type: AnonymizationEntityType
    ): string {

        switch (type) {

            case AnonymizationEntityType.PHONE:
                return text
                    .replace(/\D/g, "");

            case AnonymizationEntityType.EMAIL:
            case AnonymizationEntityType.ORCID:
                return text
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .trim();

            case AnonymizationEntityType.MEMBER:
            default:
                return text
                    .toLowerCase()
                    .replace(/["'“”‘’]/g, "")
                    .replace(/[.,]/g, "")
                    .trim();
        }
    }
}