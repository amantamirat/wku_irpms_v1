export interface NewLegacyProjectDTO {
    Decission: string;

    ConceptNoteId: string;
    ConceptNoteCode: string;
    ConceptNoteTitle: string;
    ConceptNoteStatus: number;
    ConceptNoteProgressStatus: number;

    ProposalStatus: number;
    ProposalProgressStatus: number;

    GrantStatus: number;
    GrantApprovalStatus: number;

    Phase1ProgressStatus: number;
    Phase1Status: number;
    Phase1FundStatus: number;

    Phase2ProgressStatus: number;
    Phase2Status: number;
    Phase2FundStatus: number;

    Phase3ProgressStatus: number | null;
    Phase3Status: number | null;
    Phase3FundStatus: number | null;

    Phase4ProgressStatus: number | null;
    Phase4Status: number | null;
    Phase4FundStatus: number | null;

    Phase5ProgressStatus: number | null;
    Phase5Status: number | null;
    Phase5FundStatus: number | null;

    ResearchCost: number;
    ApprovedBudget: number;

    Duration: number;
    ApprovedDuration: number;

    ConceptNoteSubmitDate: number;
    ConceptNoteModifiedDate: number;

    AcYear: string;

    Theme: string;
    SubTheme: string;
    GrantType: string;

    PrincipalResearcher: string;
    PrincipalResearcherEmail: string;
    PrincipalResearcherPhone: number;

    ProposalId: string;
    ProposalCreatedDate: number;
    ProposalModifiedDate: number;

    GrantId: string;

    NumberOfPhases: number;

    GrantStartDate: number;
    GrantEndDate: number;
    GrantCreatedDate: number;
    GrantModifiedDate: number;

    Phase1BudgetPercent: number;
    Phase1Cost: number;
    Phase1StartDate: number;
    Phase1EndDate: number;
    Phase1Activities: string;
    Phase1ParticipantCount: number;
    Phase1ResearchPlanDetails: string;

    Phase2BudgetPercent: number;
    Phase2Cost: number;
    Phase2StartDate: number;
    Phase2EndDate: number;
    Phase2Activities: string;
    Phase2ParticipantCount: number;
    Phase2ResearchPlanDetails: string;

    Phase3BudgetPercent: number | null;
    Phase3Cost: number | null;
    Phase3StartDate: number | null;
    Phase3EndDate: number | null;
    Phase3Activities: string | null;
    Phase3ParticipantCount: number | null;
    Phase3ResearchPlanDetails: string | null;

    Phase4BudgetPercent: number | null;
    Phase4Cost: number | null;
    Phase4StartDate: number | null;
    Phase4EndDate: number | null;
    Phase4Activities: string | null;
    Phase4ParticipantCount: number | null;
    Phase4ResearchPlanDetails: string | null;

    Phase5BudgetPercent: number | null;
    Phase5Cost: number | null;
    Phase5StartDate: number | null;
    Phase5EndDate: number | null;
    Phase5Activities: string | null;
    Phase5ParticipantCount: number | null;
    Phase5ResearchPlanDetails: string | null;

    Collaborator1: string | null;
    Collaborator1Role: number | null;
    Collaborator1Contribution: string | null;

    Collaborator2: string | null;
    Collaborator2Role: number | null;
    Collaborator2Contribution: string | null;

    Collaborator3: string | null;
    Collaborator3Role: number | null;
    Collaborator3Contribution: string | null;

    Collaborator4: string | null;
    Collaborator4Role: number | null;
    Collaborator4Contribution: string | null;

    Collaborator5: string | null;
    Collaborator5Role: number | null;
    Collaborator5Contribution: string | null;

    Collaborator6: string | null;
    Collaborator6Role: number | null;
    Collaborator6Contribution: string | null;

    Collaborator7: string | null;
    Collaborator7Role: number | null;
    Collaborator7Contribution: string | null;

    Collaborator8: string | null;
    Collaborator8Role: number | null;
    Collaborator8Contribution: string | null;

    TotalParticipantCount: number;

    ResearchPlanDetails: string;

    ReviewerDetails: string;
}