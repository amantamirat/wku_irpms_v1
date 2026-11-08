import { Dialog } from 'primereact/dialog';
import { TemplateValidationResult, ValidationResult } from '@/hooks/useValidationErrors';
import { ValidationReport } from './ValidationErrorReport';


interface ValidationDialogProps {
    templateValidation?: TemplateValidationResult | null;
    validationResult?: ValidationResult | null;
    onHide: () => void;
    header?: string;
}

export const ValidationDialog = ({
    templateValidation,
    validationResult,
    onHide,
    header = 'Validation failed'
}: ValidationDialogProps) => (
    <Dialog
        header={header}
        visible={!!(templateValidation || validationResult)}
        onHide={onHide}
        style={{ width: '600px', maxWidth: '95vw' }}
        modal
        dismissableMask
    >
        <ValidationReport
            templateValidation={templateValidation}
            validationResult={validationResult}
        />
    </Dialog>
);