type SeverityType = "success" | "info" | "warning" | "danger";
export interface TransitionRequestDto {
    current: string;
    next: string;
}