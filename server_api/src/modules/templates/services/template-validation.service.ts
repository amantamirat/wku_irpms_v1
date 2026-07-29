import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { ITemplateSection } from "../template.model";
import { TemplateRepository } from "../template.repository";
import { PdfExtractorService } from "./pdf-extractor.service";
import { ParsedSection, TemplateParserService } from "./template.parser.service";

export interface SectionValidationResult {
    name: string;
    found: boolean;
    passed: boolean;
    wordCount: number;
    issues: string[];
}

export interface TemplateValidationResult {
    valid: boolean;
    score: number;
    pages: number;
    issues: string[];
    sections: SectionValidationResult[];
}

export class TemplateValidationService {

    constructor(
        private readonly extractor: PdfExtractorService,
        private readonly parser: TemplateParserService,
        private readonly templateRepository: TemplateRepository,
        private readonly llm?: any //LLMValidationService
    ) { }

    async validate(templateId: string, pdfPath: string): Promise<TemplateValidationResult> {
        const template = await this.templateRepository.findById(templateId);
        if (!template) {
            throw new AppError(ERROR_CODES.TEMPLATE_NOT_FOUND);
        }
        const pdf = await this.extractor.extract(pdfPath);
        const parsedSections = this.parser.parse(pdf.text, template);

        const issues: string[] = [];

        if (template.minPages && pdf.pages < template.minPages) {
            issues.push(`Minimum ${template.minPages} pages required.`);
        }
        if (template.maxPages && pdf.pages > template.maxPages) {
            issues.push(`Maximum ${template.maxPages} pages allowed.`);
        }

        const results: SectionValidationResult[] = [];

        for (const expected of template.sections) {

            const parsed = parsedSections.find(
                s => s.name === expected.name);

            results.push(await this.validateSection(
                expected, parsed));
        }

        const passed =
            issues.length === 0 &&
            results.every(r => r.passed);

        const score =
            Math.round(
                results.filter(r => r.passed).length
                / results.length
                * 100
            );

        return {
            valid: passed,
            score,
            pages: pdf.pages,
            issues,
            sections: results
        };

    }


    private async validateSection(expected: ITemplateSection, parsed?: ParsedSection): Promise<SectionValidationResult> {
        const issues: string[] = [];

        if (!parsed?.found) {
            if (expected.required) {
                issues.push("Required section missing.");
            }
            return {
                name: expected.name,
                found: false,
                passed: issues.length === 0,
                wordCount: 0,
                issues
            };
        }

        const wordCount = parsed.content.trim().split(/\s+/).length;

        if (expected.minWords && wordCount < expected.minWords) {
            issues.push(`Minimum ${expected.minWords} words required.`);
        }

        if (expected.maxWords && wordCount > expected.maxWords) {
            issues.push(`Maximum ${expected.maxWords} words allowed.`);
        }

        if (expected.guidelines && this.llm) {
            const ai =
                await this.llm.validate(
                    expected.guidelines,
                    parsed.content
                );
            issues.push(...ai.issues);
        }

        return {
            name: expected.name,
            found: true,
            passed: issues.length === 0,
            wordCount,
            issues
        };
    }

}