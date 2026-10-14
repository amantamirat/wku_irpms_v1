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
                        /*
                        //was before adding spelling checker
                        return this.findMemberLocations(
                            detectedText,
                            items
                        );*/
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

    ///Fuzzeir added for spelling error

    /*

    private findMemberLocations(
        detectedText: string,
        items: PdfTextItem[]
    ): PdfTextLocation[] {

        const targetTokens = this.normalize(
            detectedText,
            AnonymizationEntityType.MEMBER
        )
            .split(/\s+/)
            .filter(Boolean);

        if (!targetTokens.length) {
            return [];
        }

        // Prefer exact matching before allowing spelling variations.
        const exact = this.findNameSequence(
            targetTokens,
            items,
            false
        );

        if (exact.length) {
            return exact;
        }

        // Fall back to conservative fuzzy matching.
        return this.findNameSequence(
            targetTokens,
            items,
            true
        );
    }

    private findNameSequence(
        targetTokens: string[],
        items: PdfTextItem[],
        allowSpellingErrors: boolean
    ): PdfTextLocation[] {

        const locations: PdfTextLocation[] = [];

        for (
            let i = 0;
            i <= items.length - targetTokens.length;
            i++
        ) {
            const sequence = items.slice(
                i,
                i + targetTokens.length
            );

            // All words must be on the same page.
            if (
                sequence.some(
                    item => item.page !== sequence[0].page
                )
            ) {
                continue;
            }

            // Avoid combining words from separate lines.
            const first = sequence[0];

            const sameLine = sequence.every(
                item =>
                    Math.abs(item.y - first.y) <=
                    Math.max(3, first.height * 0.6)
            );

            if (!sameLine) {
                continue;
            }

            const matches = sequence.every(
                (item, index) => {
                    const pdfToken = this.normalize(
                        item.text,
                        AnonymizationEntityType.MEMBER
                    );

                    const targetToken = targetTokens[index];

                    if (!allowSpellingErrors) {
                        return pdfToken === targetToken;
                    }

                    return this.isSimilarName(
                        targetToken,
                        pdfToken
                    );
                }
            );

            if (!matches) {
                continue;
            }

            locations.push(
                ...sequence.map(item => ({
                    page: item.page,
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                }))
            );

            // Prevent matching the same sequence repeatedly.
            i += targetTokens.length - 1;
        }

        return locations;
    }

    private isSimilarName(
        expected: string,
        actual: string
    ): boolean {

        if (expected === actual) {
            return true;
        }

        // Short names are too ambiguous for fuzzy matching.
        if (
            expected.length < 5 ||
            actual.length < 5
        ) {
            return false;
        }

        const distance = this.levenshteinDistance(
            expected,
            actual
        );

        // Conservative tolerance: one character difference.
        // Allow two only for longer names.
        const maxDistance =
            Math.min(expected.length, actual.length) >= 10
                ? 2
                : 1;

        return distance <= maxDistance;
    }

    private levenshteinDistance(
        a: string,
        b: string
    ): number {

        const previous = Array.from(
            { length: b.length + 1 },
            (_, i) => i
        );

        for (let i = 1; i <= a.length; i++) {
            const current = [i];

            for (let j = 1; j <= b.length; j++) {
                const cost =
                    a[i - 1] === b[j - 1] ? 0 : 1;

                current[j] = Math.min(
                    current[j - 1] + 1,     // insertion
                    previous[j] + 1,        // deletion
                    previous[j - 1] + cost  // substitution
                );
            }

            for (let j = 0; j <= b.length; j++) {
                previous[j] = current[j];
            }
        }

        return previous[b.length];
    }
*/

}