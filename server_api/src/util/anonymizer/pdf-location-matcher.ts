
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

        const target = this.normalize(detectedText, type);

        if (!target) {
            return [];
        }

        // First, preserve the existing single-item matching behavior.
        const locations = items
            .filter(item => {
                const text = this.normalize(item.text, type);

                if (
                    type === AnonymizationEntityType.MEMBER ||
                    type === AnonymizationEntityType.IDENTIFIER
                ) {
                    return text === target;
                }

                return text.includes(target);
            })
            .map(item => this.toLocation(item));

        if (locations.length > 0) {
            return locations;
        }

        // Names and identifiers can be split across PDF.js text items.
        if (
            type === AnonymizationEntityType.MEMBER ||
            type === AnonymizationEntityType.IDENTIFIER
        ) {
            return this.findAcrossItems(target, items, type);
        }

        // Phone numbers can be split into separate PDF.js text items.
        if (type === AnonymizationEntityType.PHONE) {
            return this.findPhoneLocations(detectedText, items);
        }

        return [];
    }

    private findAcrossItems(
        target: string,
        items: PdfTextItem[],
        type: AnonymizationEntityType
    ): PdfTextLocation[] {

        const results: PdfTextLocation[] = [];

        // Process each page independently.
        const pages = new Map<number, PdfTextItem[]>();

        for (const item of items) {
            const pageItems = pages.get(item.page) ?? [];
            pageItems.push(item);
            pages.set(item.page, pageItems);
        }

        for (const [page, pageItems] of pages) {

            // PDF.js generally returns text items in reading order.
            // Sort spatially to make adjacent-item matching predictable.
            const sorted = [...pageItems].sort((a, b) => {
                const verticalDifference = a.y - b.y;

                if (Math.abs(verticalDifference) > 3) {
                    return verticalDifference;
                }

                return a.x - b.x;
            });

            for (let start = 0; start < sorted.length; start++) {

                let combined = "";
                let selected: PdfTextItem[] = [];

                for (
                    let end = start;
                    end < sorted.length && end < start + 8;
                    end++
                ) {
                    const current = sorted[end];

                    if (end > start) {
                        const previous = sorted[end - 1];

                        // Do not combine text across different lines.
                        if (
                            Math.abs(current.y - previous.y) > 3
                        ) {
                            break;
                        }

                        // Avoid matching text across distant columns/areas.
                        const gap =
                            current.x -
                            (previous.x + previous.width);

                        if (gap > 30 || gap < -5) {
                            break;
                        }
                    }

                    selected.push(current);
                    combined += current.text;

                    const normalized = this.normalize(combined, type);

                    if (normalized === target) {
                        results.push(
                            this.combineLocations(selected, page)
                        );
                        break;
                    }

                    // Stop when the combined text has passed the target.
                    if (
                        normalized.length >= target.length &&
                        normalized !== target
                    ) {
                        break;
                    }
                }
            }
        }

        return results;
    }

    private findPhoneLocations(
        detectedText: string,
        items: PdfTextItem[]
    ): PdfTextLocation[] {

        const parts = detectedText
            .split(/[\s-]+/)
            .filter(Boolean);

        const locations: PdfTextLocation[] = [];

        for (const part of parts) {
            const normalizedPart = this.normalize(
                part,
                AnonymizationEntityType.PHONE
            );

            if (!normalizedPart) {
                continue;
            }

            for (const item of items) {
                const itemText = this.normalize(
                    item.text,
                    AnonymizationEntityType.PHONE
                );

                if (itemText === normalizedPart) {
                    locations.push(this.toLocation(item));
                }
            }
        }

        return locations;
    }

    private combineLocations(
        items: PdfTextItem[],
        page: number
    ): PdfTextLocation {

        const x = Math.min(...items.map(item => item.x));
        const y = Math.min(...items.map(item => item.y));

        const right = Math.max(
            ...items.map(item => item.x + item.width)
        );

        const bottom = Math.max(
            ...items.map(item => item.y + item.height)
        );

        return {
            page,
            x,
            y,
            width: right - x,
            height: bottom - y
        };
    }

    private toLocation(item: PdfTextItem): PdfTextLocation {
        return {
            page: item.page,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height
        };
    }

    private normalize(
        text: string,
        type: AnonymizationEntityType
    ): string {

        switch (type) {

            case AnonymizationEntityType.PHONE:
                return text.replace(/\D/g, "");

            case AnonymizationEntityType.EMAIL:
            case AnonymizationEntityType.ORCID:
                return text
                    .toLowerCase()
                    .replace(/\s+/g, "")
                    .trim();

            case AnonymizationEntityType.MEMBER:
            case AnonymizationEntityType.IDENTIFIER:
            default:
                return text
                    .toLowerCase()
                    .replace(/["'“”‘’]/g, "")
                    .replace(/[.,]/g, "")
                    .replace(/\s+/g, " ")
                    .trim();
        }
    }
}
