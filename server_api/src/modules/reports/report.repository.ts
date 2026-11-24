import { ScopeFilter } from "../auth/auth.types";
import { FundingSource, Grant } from "../grants/grant.model";
import { Verification, VerificationStatus } from "../grants/verifications/verification.model";
import { Application, ApplicationStatus } from "../applications/application.model";
import { Phase, PhaseStatus } from "../projects/phase/phase.model";
import { Project, ProjectStatus } from "../projects/project.model";
import { Reviewer } from "../reviewers/reviewer.model";
import { ReviewerStatus } from "../reviewers/reviewer.state-machine";
import { IDashboardReport, IDepartmentReport, IReportFilter, IResearcherReport, IVerificationReport } from "./report.types";
import mongoose from "mongoose";
import { Organization } from "../organization/organization.model";
import User, { Gender } from "../users/user.model";
import { Collaborator, CollaboratorStatus } from "../projects/collaborators/collaborator.model";
import { Unit } from "../../common/constants/enums";

export function buildProjectMatch(
    filter: IReportFilter
): Record<string, any> {

    const match: Record<string, any> = {};

    if (filter.grant) {
        match.grant = filter.grant;
    }

    if (filter.call) {
        match.call = filter.call;
    }

    if (filter.workspace) {
        match.workspace = filter.workspace;
    }

    if (filter.organization) {
        match.organization = filter.organization;
    }

    if (filter.calendar) {
        match.calendar = filter.calendar;
    }

    if (filter.dateFrom || filter.dateTo) {
        match.createdAt = {};

        if (filter.dateFrom) {
            match.createdAt.$gte = filter.dateFrom;
        }

        if (filter.dateTo) {
            match.createdAt.$lte = filter.dateTo;
        }
    }

    return match;
}

function combineProjectFilters(
    projectFilter: Record<string, any>,
    scopeFilter: ScopeFilter
) {
    if (Object.keys(scopeFilter).length === 0) {
        return projectFilter;
    }

    return {
        $and: [
            projectFilter,
            scopeFilter
        ]
    };
}

export class ReportRepository {

    async getDashboard(filter: IReportFilter,
        scopeFilter: ScopeFilter): Promise<IDashboardReport> {

        const projectFilter = buildProjectMatch(filter);

        const projectMatch = combineProjectFilters(
            projectFilter,
            scopeFilter
        );

        const [
            portfolio,
            applications,
            reviewers,
            verifications,
            departments

        ] = await Promise.all([

            this.getPortfolio(projectMatch),

            this.getApplications(projectMatch),

            this.getReviewerReport(projectMatch),

            this.getVerificationReport(projectMatch),

            this.getDepartmentReport(projectMatch),

        ]);

        return {
            portfolio,
            applications,
            reviewers,
            verifications,
            departments
        };
    }

    async getPortfolio(
        projectMatch: Record<string, any>
    ) {
        const [result] = await Project.aggregate([
            {
                $match: projectMatch
            },

            {
                $group: {
                    _id: null,

                    totalProjects: {
                        $sum: 1
                    },

                    draftProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.draft] },
                                1,
                                0
                            ]
                        }
                    },

                    approvedProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.approved] },
                                1,
                                0
                            ]
                        }
                    },

                    refusedProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.refused] },
                                1,
                                0
                            ]
                        }
                    },

                    grantedProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.granted] },
                                1,
                                0
                            ]
                        }
                    },

                    completedProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.completed] },
                                1,
                                0
                            ]
                        }
                    },
                    terminatedProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.terminated] },
                                1,
                                0
                            ]
                        }
                    },
                    verifiedProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.verified] },
                                1,
                                0
                            ]
                        }
                    },
                }
            },

            {
                $project: {
                    _id: 0,
                    totalProjects: 1,
                    draftProjects: 1,
                    approvedProjects: 1,
                    refusedProjects: 1,
                    grantedProjects: 1,
                    completedProjects: 1,
                    terminatedProjects: 1,
                    verifiedProjects: 1,
                }
            }
        ]);

        return result ?? {
            totalProjects: 0,
            draftProjects: 0,
            approvedProjects: 0,
            refusedProjects: 0,
            grantedProjects: 0,
            completedProjects: 0,
            terminatedProjects: 0
        };
    }

    async getApplications(filter: IReportFilter) {
        const projectIds = await Project
            .find(buildProjectMatch(filter))
            .select("_id")
            .lean();

        const ids = projectIds.map(project => project._id);

        const emptyResult = {
            total: 0,
            submitted: 0,
            shortlisted: 0,
            notShortlisted: 0,
            accepted: 0,
            rejected: 0,
            shortlistingRate: 0,
            acceptanceRate: 0,
            averageScore: null
        };

        if (!ids.length) {
            return emptyResult;
        }

        // Application-level filters
        const applicationMatch: Record<string, any> = {
            project: { $in: ids }
        };

        if (filter.stage) {
            applicationMatch.stage = filter.stage;
        }

        const [result] = await Application.aggregate([
            {
                $match: applicationMatch
            },
            {
                $group: {
                    _id: null,

                    total: { $sum: 1 },

                    submitted: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ApplicationStatus.submitted] },
                                1, 0
                            ]
                        }
                    },

                    shortlisted: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ApplicationStatus.shortlisted] },
                                1, 0
                            ]
                        }
                    },

                    notShortlisted: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ApplicationStatus.notShortlisted] },
                                1, 0
                            ]
                        }
                    },

                    accepted: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ApplicationStatus.accepted] },
                                1, 0
                            ]
                        }
                    },

                    rejected: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ApplicationStatus.rejected] },
                                1, 0
                            ]
                        }
                    },

                    averageScore: {
                        $avg: "$totalScore"
                    }
                }
            }
        ]);

        if (!result) {
            return emptyResult;
        }

        const shortlistingDecided =
            result.shortlisted + result.notShortlisted;

        const finalDecided =
            result.accepted +
            result.rejected +
            result.notShortlisted;

        return {
            total: result.total,
            submitted: result.submitted,
            shortlisted: result.shortlisted,
            notShortlisted: result.notShortlisted,
            accepted: result.accepted,
            rejected: result.rejected,

            shortlistingRate: shortlistingDecided > 0
                ? (result.shortlisted / shortlistingDecided) * 100
                : 0,

            acceptanceRate: finalDecided > 0
                ? (result.accepted / finalDecided) * 100
                : 0,

            averageScore: result.averageScore !== null
                ? Number(result.averageScore.toFixed(2))
                : null
        };
    }


    async getReviewerReport(filter: IReportFilter) {
        const emptyResult = {
            totalReviews: 0,
            completedReviews: 0,
            pendingReviews: 0,
            declinedReviews: 0,
            rejectedReviews: 0,
            completionRate: 0,
            averageScore: null
        };

        const projects = await Project
            .find(buildProjectMatch(filter))
            .select("_id")
            .lean();

        const projectIds = projects.map(project => project._id);

        if (!projectIds.length) {
            return emptyResult;
        }

        const pipeline: any[] = [
            {
                $match: {
                    project: { $in: projectIds }
                }
            }
        ];

        // Filter by application stage
        if (filter.stage) {
            pipeline.push(
                {
                    $lookup: {
                        from: "applications",
                        localField: "application",
                        foreignField: "_id",
                        as: "applicationData"
                    }
                },
                {
                    $unwind: "$applicationData"
                },
                {
                    $match: {
                        "applicationData.stage": filter.stage
                    }
                }
            );
        }

        pipeline.push({
            $group: {
                _id: null,

                totalReviews: { $sum: 1 },

                completedReviews: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    "$status",
                                    [
                                        ReviewerStatus.submitted,
                                        ReviewerStatus.accepted,
                                        ReviewerStatus.rejected
                                    ]
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                pendingReviews: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    "$status",
                                    [
                                        ReviewerStatus.pending,
                                        ReviewerStatus.verified
                                    ]
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                declinedReviews: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", ReviewerStatus.declined] },
                            1,
                            0
                        ]
                    }
                },

                rejectedReviews: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", ReviewerStatus.rejected] },
                            1,
                            0
                        ]
                    }
                },

                averageScore: { $avg: "$score" }
            }
        });

        const [result] = await Reviewer.aggregate(pipeline);

        if (!result) {
            return emptyResult;
        }

        return {
            totalReviews: result.totalReviews,
            completedReviews: result.completedReviews,
            pendingReviews: result.pendingReviews,
            declinedReviews: result.declinedReviews,
            rejectedReviews: result.rejectedReviews,

            completionRate:
                result.totalReviews > 0
                    ? Number(
                        (
                            (result.completedReviews / result.totalReviews) *
                            100
                        ).toFixed(2)
                    )
                    : 0,

            averageScore:
                result.averageScore !== null &&
                    result.averageScore !== undefined
                    ? Number(result.averageScore.toFixed(2))
                    : null
        };
    }

    async getVerificationReport(
        projectMatch: Record<string, any>
    ): Promise<IVerificationReport> {

        const projectIds = await Project
            .find(projectMatch)
            .select("_id")
            .lean();

        const ids = projectIds.map(project => project._id);

        const emptyResult: IVerificationReport = {
            totalVerifications: 0,
            submittedVerifications: 0,
            verifiedVerifications: 0,
            rejectedVerifications: 0,
            verificationRate: 0,
            rejectionRate: 0,
            averageScore: null,
            averageReviewTime: null,
            averageVerificationAttempts: 0
        };

        if (!ids.length) {
            return emptyResult;
        }

        const [result] = await Verification.aggregate([
            {
                $match: {
                    project: {
                        $in: ids
                    }
                }
            },
            {
                $set: {
                    submittedAt: "$createdAt",

                    reviewedAtFromHistory: {
                        $max: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: {
                                            $ifNull: [
                                                "$statusHistory",
                                                []
                                            ]
                                        },
                                        as: "history",
                                        cond: {
                                            $in: [
                                                "$$history.status",
                                                [
                                                    VerificationStatus.verified,
                                                    VerificationStatus.rejected
                                                ]
                                            ]
                                        }
                                    }
                                },
                                as: "history",
                                in: "$$history.changedAt"
                            }
                        }
                    }
                }
            },

            /*
             * Review duration in days.
             */
            {
                $set: {
                    reviewTime: {
                        $cond: [
                            {
                                $and: [
                                    {
                                        $ne: [
                                            "$submittedAt",
                                            null
                                        ]
                                    },
                                    {
                                        $ne: [
                                            "$reviewedAtFromHistory",
                                            null
                                        ]
                                    }
                                ]
                            },
                            {
                                $divide: [
                                    {
                                        $subtract: [
                                            "$reviewedAtFromHistory",
                                            "$submittedAt"
                                        ]
                                    },
                                    1000 * 60 * 60 * 24
                                ]
                            },
                            null
                        ]
                    }
                }
            },

            /*
             * Produce report metrics.
             */
            {
                $group: {
                    _id: null,

                    totalVerifications: {
                        $sum: 1
                    },

                    submittedVerifications: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        VerificationStatus.submitted
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    verifiedVerifications: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        VerificationStatus.verified
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    rejectedVerifications: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        VerificationStatus.rejected
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    averageScore: {
                        $avg: "$totalScore"
                    },

                    averageReviewTime: {
                        $avg: "$reviewTime"
                    },

                    averageVerificationAttempts: {
                        $avg: "$attempt"
                    }
                }
            },

            /*
             * Calculate percentages.
             */
            {
                $set: {
                    verificationRate: {
                        $cond: [
                            {
                                $gt: [
                                    "$totalVerifications",
                                    0
                                ]
                            },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$verifiedVerifications",
                                            "$totalVerifications"
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    },

                    rejectionRate: {
                        $cond: [
                            {
                                $gt: [
                                    "$totalVerifications",
                                    0
                                ]
                            },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$rejectedVerifications",
                                            "$totalVerifications"
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            },

            {
                $project: {
                    _id: 0,

                    totalVerifications: 1,
                    submittedVerifications: 1,
                    verifiedVerifications: 1,
                    rejectedVerifications: 1,

                    verificationRate: 1,
                    rejectionRate: 1,

                    averageScore: 1,
                    averageReviewTime: 1,
                    averageVerificationAttempts: 1
                }
            }
        ]);

        if (!result) {
            return emptyResult;
        }

        return {
            ...result,

            averageScore:
                result.averageScore !== null
                    ? Number(result.averageScore.toFixed(2))
                    : null,

            averageReviewTime:
                result.averageReviewTime !== null
                    ? Number(result.averageReviewTime.toFixed(2))
                    : null,

            averageVerificationAttempts:
                result.averageVerificationAttempts !== null
                    ? Number(result.averageVerificationAttempts.toFixed(2))
                    : 0
        };
    }


    async getDepartmentReport(
        projectMatch: Record<string, any>
    ): Promise<IDepartmentReport[]> {
        return Project.aggregate([
            {
                $match: {
                    ...projectMatch,
                    status: {
                        $in: [
                            ProjectStatus.approved,
                            ProjectStatus.granted,
                            ProjectStatus.completed,
                            ProjectStatus.terminated,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: "$workspace",

                    projects: { $sum: 1 },

                    totalBudget: {
                        $sum: {
                            $ifNull: ["$totalBudget", 0],
                        },
                    },

                    approved: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.approved] },
                                1,
                                0,
                            ],
                        },
                    },

                    granted: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.granted] },
                                1,
                                0,
                            ],
                        },
                    },

                    completed: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.completed] },
                                1,
                                0,
                            ],
                        },
                    },

                    terminated: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.terminated] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: "organizations",
                    localField: "_id",
                    foreignField: "_id",
                    as: "workspace",
                },
            },
            {
                $addFields: {
                    name: {
                        $ifNull: [
                            { $arrayElemAt: ["$workspace.name", 0] },
                            "Unknown",
                        ],
                    },
                },
            },
            {
                $project: {
                    workspace: 0,
                },
            },
            {
                $sort: {
                    totalBudget: -1,
                },
            },
        ]);
    }


    async getDirectorateReport(fiscalYear?: string) {
        const match: Record<string, any> = { fundingSource: FundingSource.INTERNAL };
        if (fiscalYear) match.fiscalYear = fiscalYear;

        return Grant.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "projects",
                    let: { grantId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$grant", "$$grantId"] },
                                status: { $in: [ProjectStatus.approved, ProjectStatus.granted, ProjectStatus.completed] },
                            },
                        },
                        { $group: { _id: null, committed: { $sum: { $ifNull: ["$totalBudget", 0] } }, count: { $sum: 1 } } },
                    ],
                    as: "proj",
                },
            },
            {
                $addFields: {
                    committed: { $ifNull: [{ $first: "$proj.committed" }, 0] },
                    projectCount: { $ifNull: [{ $first: "$proj.count" }, 0] },
                },
            },
            {
                $group: {
                    _id: "$organization",
                    allocated: { $sum: "$amount" },
                    committed: { $sum: "$committed" },
                    used: { $sum: "$usedBudget" },
                    grantCount: { $sum: 1 },
                    projectCount: { $sum: "$projectCount" },
                },
            },
            {
                $addFields: {
                    unallocated: { $subtract: ["$allocated", { $max: ["$committed", "$used"] }] },
                    utilization: {
                        $cond: [{ $gt: ["$allocated", 0] }, { $round: [{ $multiply: [{ $divide: ["$used", "$allocated"] }, 100] }, 2] }, 0],
                    },
                    commitmentRate: {
                        $cond: [{ $gt: ["$allocated", 0] }, { $round: [{ $multiply: [{ $divide: ["$committed", "$allocated"] }, 100] }, 2] }, 0],
                    },
                },
            },
            { $lookup: { from: "organizations", localField: "_id", foreignField: "_id", as: "org" } },
            { $addFields: { name: { $first: "$org.name" } } },
            { $project: { org: 0 } },
            { $sort: { allocated: -1 } },
        ]);
    }


    async getFinancial(filter?: IReportFilter) {
        const match: Record<string, any> = {};

        if (filter?.fundingSource) {
            match.fundingSource = filter.fundingSource;
        }

        const [result] = await Grant.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalGrantAmount: { $sum: "$amount" },
                    usedGrantBudget: { $sum: "$usedBudget" },
                    committedGrantBudget: { $sum: "$committedBudget" }, // <-- your field name here
                    internalFunding: {
                        $sum: {
                            $cond: [{ $eq: ["$fundingSource", FundingSource.INTERNAL] }, "$amount", 0]
                        }
                    },
                    externalFunding: {
                        $sum: {
                            $cond: [{ $eq: ["$fundingSource", FundingSource.EXTERNAL] }, "$amount", 0]
                        }
                    }
                }
            }
        ]);

        if (!result) {
            return {
                totalGrantAmount: 0,
                usedGrantBudget: 0,
                committedGrantBudget: 0,
                unallocatedGrantBudget: 0,
                remainingGrantBudget: 0,
                utilizationRate: 0,
                internalFunding: 0,
                externalFunding: 0
            };
        }

        const { totalGrantAmount, usedGrantBudget, committedGrantBudget } = result;

        return {
            totalGrantAmount,
            usedGrantBudget,
            committedGrantBudget,
            remainingGrantBudget: totalGrantAmount - usedGrantBudget,
            unallocatedGrantBudget: totalGrantAmount - usedGrantBudget - committedGrantBudget,
            utilizationRate:
                totalGrantAmount > 0
                    ? Number(((usedGrantBudget / totalGrantAmount) * 100).toFixed(2))
                    : 0,
            internalFunding: result.internalFunding,
            externalFunding: result.externalFunding
        };
    }





    async getPhases(
        projectMatch: Record<string, any>
    ) {
        const projectIds = await Project
            .find({
                ...projectMatch,
                status: ProjectStatus.granted
            })
            .select("_id")
            .lean();

        const ids = projectIds.map(project => project._id);

        if (!ids.length) {
            return {
                total: 0,
                active: 0,
                completed: 0,
                terminated: 0,
                completionRate: 0
            };
        }

        const [result] = await Phase.aggregate([

            {
                $match: {
                    project: {
                        $in: ids
                    }
                }
            },

            {
                $group: {
                    _id: null,

                    total: {
                        $sum: 1
                    },

                    active: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        PhaseStatus.active
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    completed: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        PhaseStatus.completed
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    terminated: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        PhaseStatus.cancelled
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        if (!result) {
            return {
                total: 0,
                active: 0,
                completed: 0,
                terminated: 0,
                completionRate: 0
            };
        }

        const executable =
            result.active +
            result.completed +
            result.terminated;

        return {
            total: result.total,
            active: result.active,
            completed: result.completed,
            terminated: result.terminated,

            completionRate:
                executable > 0
                    ? Number(
                        (
                            result.completed /
                            executable *
                            100
                        ).toFixed(2)
                    )
                    : 0
        };
    }





    async getResearcherReport(
        projectMatch: Record<string, any>
    ): Promise<IResearcherReport> {

        const UNASSIGNED = "unassigned";

        const emptyResult: IResearcherReport = {
            totalResearchers: 0,

            activeResearchers: 0,
            inactiveResearchers: 0,

            leadResearchers: 0,
            collaboratingResearchers: 0,

            maleResearchers: 0,
            femaleResearchers: 0,
            unknownGender: 0,

            activeMaleResearchers: 0,
            activeFemaleResearchers: 0,
            activeUnknownGender: 0,

            researchersWithProjects: 0,
            researchersWithoutProjects: 0,

            averageProjectsPerResearcher: 0,
            averageTeamSize: 0,

            byCollege: [],
            bySpecialization: []
        };

        // 1. Fetch all departments and their parent colleges.
        const departments = await Organization.find({
            type: Unit.department
        })
            .select("_id parent")
            .lean();

        const departmentIds = departments.map(
            department => department._id
        );

        // Department ID -> College ID
        const departmentCollege = new Map<string, string | null>(
            departments.map((department: any) => [
                department._id.toString(),
                department.parent
                    ? department.parent.toString()
                    : null
            ])
        );

        // 2. Fetch all researchers belonging to departments.
        const researchers = departmentIds.length
            ? await User.find({
                workspace: { $in: departmentIds },
                deletedAt: null
            })
                .select("gender workspace specializations")
                .lean()
            : [];

        if (!researchers.length) {
            return emptyResult;
        }

        // 3. Fetch projects matching the report filters.
        const projects = await Project.find(projectMatch)
            .select("_id leadPI status")
            .lean();

        const projectMap = new Map(
            projects.map(project => [
                project._id.toString(),
                project
            ])
        );

        const projectIds = projects.map(project => project._id);

        // 4. Fetch verified collaborators.
        const collaborations = projectIds.length
            ? await Collaborator.find({
                project: { $in: projectIds },
                status: CollaboratorStatus.verified
            })
                .select("project member isLeadPI")
                .lean()
            : [];

        // Researcher ID -> unique project IDs
        const researcherProjects = new Map<string, Set<string>>();

        const leadResearchers = new Set<string>();
        const collaboratorResearchers = new Set<string>();
        const activeResearchers = new Set<string>();

        const researcherIdSet = new Set(
            researchers.map(researcher => researcher._id.toString())
        );

        // 5. Register researcher participation in a project.
        const addParticipation = (
            memberId: mongoose.Types.ObjectId,
            projectId: mongoose.Types.ObjectId
        ) => {
            if (!memberId || !projectId) return;

            const memberKey = memberId.toString();
            const projectKey = projectId.toString();

            // Only count users belonging to the researcher population.
            if (!researcherIdSet.has(memberKey)) return;

            if (!researcherProjects.has(memberKey)) {
                researcherProjects.set(memberKey, new Set());
            }

            researcherProjects.get(memberKey)!.add(projectKey);

            const project = projectMap.get(projectKey);

            // A researcher is active if they participate in
            // at least one approved or granted project.
            if (
                project &&
                [
                    ProjectStatus.approved,
                    ProjectStatus.granted
                ].includes(project.status)
            ) {
                activeResearchers.add(memberKey);
            }
        };

        // 6. Process project lead PIs.
        for (const project of projects) {
            if (!project.leadPI) continue;

            const leadId = project.leadPI as mongoose.Types.ObjectId;

            addParticipation(leadId, project._id);

            if (researcherIdSet.has(leadId.toString())) {
                leadResearchers.add(leadId.toString());
            }
        }

        // 7. Process verified collaborators.
        for (const collaboration of collaborations) {
            const memberId = collaboration.member as mongoose.Types.ObjectId;

            if (!memberId) continue;

            addParticipation(
                memberId,
                collaboration.project as mongoose.Types.ObjectId
            );

            if (researcherIdSet.has(memberId.toString())) {
                collaboratorResearchers.add(memberId.toString());

                if (collaboration.isLeadPI) {
                    leadResearchers.add(memberId.toString());
                }
            }
        }

        // 8. Calculate researcher statistics.
        const totalResearchers = researchers.length;

        let maleResearchers = 0;
        let femaleResearchers = 0;
        let unknownGender = 0;

        let activeMaleResearchers = 0;
        let activeFemaleResearchers = 0;
        let activeUnknownGender = 0;

        let researchersWithProjects = 0;
        let totalProjectParticipations = 0;

        const collegeCounts = new Map<string, number>();
        const specializationCounts = new Map<string, number>();

        for (const researcher of researchers) {
            const researcherId = researcher._id.toString();

            const projectCount =
                researcherProjects.get(researcherId)?.size ?? 0;

            totalProjectParticipations += projectCount;

            if (projectCount > 0) {
                researchersWithProjects++;
            }

            const isActive = activeResearchers.has(researcherId);

            // Gender distribution.
            if (researcher.gender === Gender.Male) {
                maleResearchers++;

                if (isActive) {
                    activeMaleResearchers++;
                }

            } else if (researcher.gender === Gender.Female) {
                femaleResearchers++;

                if (isActive) {
                    activeFemaleResearchers++;
                }

            } else {
                unknownGender++;

                if (isActive) {
                    activeUnknownGender++;
                }
            }

            // Group researchers by their department's parent college.
            const collegeKey = researcher.workspace
                ? departmentCollege.get(researcher.workspace.toString()) ?? UNASSIGNED
                : UNASSIGNED;

            collegeCounts.set(
                collegeKey,
                (collegeCounts.get(collegeKey) ?? 0) + 1
            );

            // Group researchers by specialization.
            for (const specialization of researcher.specializations ?? []) {
                const specializationId = specialization.toString();

                specializationCounts.set(
                    specializationId,
                    (specializationCounts.get(specializationId) ?? 0) + 1
                );
            }
        }

        // 9. Resolve college names.
        const collegeIds = [...collegeCounts.keys()]
            .filter(id => id !== UNASSIGNED)
            .map(id => new mongoose.Types.ObjectId(id));

        const colleges = collegeIds.length
            ? await Organization.find({
                _id: { $in: collegeIds }
            })
                .select("name")
                .lean()
            : [];

        const collegeMap = new Map(
            colleges.map(college => [
                college._id.toString(),
                college.name
            ])
        );

        // 10. Calculate active researchers.
        const activeCount = activeResearchers.size;

        // 11. Calculate average team size.
        // Total unique researcher-project participations / total projects.
        const averageTeamSize = projects.length > 0
            ? Number(
                (
                    totalProjectParticipations /
                    projects.length
                ).toFixed(2)
            )
            : 0;

        // 12. Calculate average projects per researcher.
        const averageProjectsPerResearcher = totalResearchers > 0
            ? Number(
                (
                    totalProjectParticipations /
                    totalResearchers
                ).toFixed(2)
            )
            : 0;

        // 13. Return report.
        return {
            totalResearchers,

            activeResearchers: activeCount,
            inactiveResearchers: totalResearchers - activeCount,

            leadResearchers: researchers.filter(user =>
                leadResearchers.has(user._id.toString())
            ).length,

            collaboratingResearchers: researchers.filter(user =>
                collaboratorResearchers.has(user._id.toString())
            ).length,

            maleResearchers,
            femaleResearchers,
            unknownGender,

            activeMaleResearchers,
            activeFemaleResearchers,
            activeUnknownGender,

            researchersWithProjects,

            researchersWithoutProjects:
                totalResearchers - researchersWithProjects,

            averageProjectsPerResearcher,

            averageTeamSize,

            byCollege: [...collegeCounts.entries()]
                .map(([collegeId, count]) => ({
                    college:
                        collegeId === UNASSIGNED
                            ? "Unassigned"
                            : collegeMap.get(collegeId) ?? "Unknown",
                    count
                }))
                .sort((a, b) => b.count - a.count),

            // Specialization IDs (resolve names separately if needed).
            bySpecialization: [...specializationCounts.entries()]
                .map(([specialization, count]) => ({
                    specialization,
                    count
                }))
                .sort((a, b) => b.count - a.count)
        };
    }


    /*

    async getFundingOrganizations(
        projectMatch: Record<string, any>
    ): Promise<IFundingOrganizationMetric[]> {

        return Project.aggregate<IFundingOrganizationMetric>([
            {
                $match: projectMatch
            },

            // Project -> Grant
            {
                $lookup: {
                    from: "grants",
                    localField: "grant",
                    foreignField: "_id",
                    as: "grant"
                }
            },

            {
                $unwind: "$grant"
            },

            // Grant -> Funding Organization
            {
                $lookup: {
                    from: "organizations",
                    localField: "grant.organization",
                    foreignField: "_id",
                    as: "organization"
                }
            },

            {
                $unwind: "$organization"
            },

            // Group by funding organization
            {
                $group: {
                    _id: "$organization._id",

                    name: {
                        $first: "$organization.name"
                    },

                    projectCount: {
                        $sum: 1
                    },

                    fundingAmount: {
                        $sum: "$grant.amount"
                    },

                    usedBudget: {
                        $sum: "$grant.usedBudget"
                    }
                }
            },

            // Calculate remaining budget and utilization
            {
                $addFields: {
                    remainingBudget: {
                        $subtract: [
                            "$fundingAmount",
                            "$usedBudget"
                        ]
                    },

                    utilizationRate: {
                        $cond: [
                            {
                                $gt: [
                                    "$fundingAmount",
                                    0
                                ]
                            },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            "$usedBudget",
                                            "$fundingAmount"
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            },

            // Shape response
            {
                $project: {
                    _id: 0,

                    organization: "$_id",

                    name: 1,

                    projectCount: 1,

                    fundingAmount: 1,

                    usedBudget: 1,

                    remainingBudget: 1,

                    utilizationRate: {
                        $round: [
                            "$utilizationRate",
                            2
                        ]
                    }
                }
            },

            // Highest funding first
            {
                $sort: {
                    fundingAmount: -1
                }
            }
        ]);
    }*/


}
