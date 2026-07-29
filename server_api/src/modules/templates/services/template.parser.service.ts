import { ITemplate } from "../template.model";

export interface ParsedSection {
    name: string;
    found: boolean;
    content: string;
    startIndex?: number;
    endIndex?: number;
}

export class TemplateParserService {

    parse(text: string, template: ITemplate): ParsedSection[] {
        const sections: ParsedSection[] = [];

        const normalizedText = this.normalize(text);

        for (const section of template.sections) {

            const headings = [
                section.name,
                ...(section.aliases || [])
            ];

            const position = this.findHeading(normalizedText, headings);

            if (position === -1) {
                sections.push({
                    name: section.name,
                    found: false,
                    content: ""
                });
                continue;
            }
            sections.push({
                name: section.name,
                found: true,
                content: this.extractSectionContent(
                    normalizedText,
                    position,
                    template.sections,
                    section.name
                )
            });
        }
        return sections;
    }

    private findHeading(text: string, headings: string[]): number {

        for (const heading of headings) {
            const index = text.toLowerCase().indexOf(heading.toLowerCase());
            if (index !== -1) {
                return index;
            }
        }
        return -1;
    }



    private extractSectionContent(text: string, start: number, sections: any[], currentName: string): string {

        const remaining = text.substring(start);
        const nextSections = sections.filter(s => s.name !== currentName)
            .map(s => s.name.toLowerCase());

        let end = remaining.length;

        for (const next of nextSections) {
            const index = remaining.toLowerCase().indexOf(next);
            if (index !== -1 && index < end) {
                end = index;
            }
        }
        return remaining.substring(0, end).trim();
    }

    private normalize(text: string) {
        return text.replace(/\r/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    }

}