
import { COLLECTIONS } from "../../common/constants/collections.enum";
import { FundingSource, Grant } from "../grants/grant.model";
import { Application, ApplicationStatus } from "../projects/applications/application.model";
import { Phase, PhaseStatus } from "../projects/phase/phase.model";
import { Project, ProjectStatus } from "../projects/project.model";
import { Reviewer } from "../reviewers/reviewer.model";
import { ReviewerStatus } from "../reviewers/reviewer.state-machine";
import { IReportFilter } from "./report.types";

function buildProjectMatch(filter: IReportFilter) {

    const match: Record<string, any> = {};

    if (filter.grant) {
        match.grant = filter.grant;
    }

    if (filter.call) {
        match.call = filter.call;
    }

    if (filter.theme) {
        match.themes = filter.theme;
    }

    if (filter.projectStatus) {
        match.status = filter.projectStatus;
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

export class ReportRepository {

    async getDashboard(filter: IReportFilter) {

        const projectMatch = buildProjectMatch(filter);

        const [
            portfolio,
            applications,
            //evaluation,
            financial,
            // phases,
            //departments
        ] = await Promise.all([

            this.getPortfolio(projectMatch),

            this.getApplications(projectMatch),

            // this.getEvaluation(projectMatch),

            this.getFinancial(filter),

            // this.getPhases(projectMatch),

            // this.getDepartments(projectMatch)

        ]);

        return {
            portfolio,
            applications,
            //  evaluation,
            financial,
            // phases,
            /*
            researchOrganization: {
                byDepartment: departments,
                byCollege: []
            }*/
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

                    activeProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.active] },
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

                    approvedProjects: {
                        $sum: {
                            $cond: [
                                { $eq: ["$status", ProjectStatus.approved] },
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
                    }
                }
            },

            {
                $project: {
                    _id: 0,
                    totalProjects: 1,
                    activeProjects: 1,
                    completedProjects: 1,
                    terminatedProjects: 1,
                    approvedProjects: 1,
                    grantedProjects: 1
                }
            }

        ]);

        return result ?? {
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            terminatedProjects: 0,
            approvedProjects: 0,
            grantedProjects: 0
        };
    }

    async getApplications(
        projectMatch: Record<string, any>
    ) {

        const projectIds = await Project
            .find(projectMatch)
            .select("_id")
            .lean();

        const ids = projectIds.map(project => project._id);

        if (!ids.length) {
            return {
                total: 0,
                pending: 0,
                accepted: 0,
                rejected: 0,
                acceptanceRate: 0,
                averageScore: null
            };
        }

        const [result] = await Application.aggregate([

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

                    pending: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        ApplicationStatus.pending
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    accepted: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        ApplicationStatus.accepted
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    rejected: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        ApplicationStatus.rejected
                                    ]
                                },
                                1,
                                0
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
            return {
                total: 0,
                pending: 0,
                accepted: 0,
                rejected: 0,
                acceptanceRate: 0,
                averageScore: null
            };
        }

        const decided =
            result.accepted +
            result.rejected;

        return {
            total: result.total,
            pending: result.pending,
            accepted: result.accepted,
            rejected: result.rejected,

            acceptanceRate: decided > 0
                ? (result.accepted / decided) * 100
                : 0,

            averageScore: result.averageScore !== null
                ? Number(result.averageScore.toFixed(2))
                : null
        };
    }

    async getEvaluation(
        projectMatch: Record<string, any>
    ) {

        const projectIds = await Project
            .find(projectMatch)
            .select("_id")
            .lean();

        const ids = projectIds.map(project => project._id);

        if (!ids.length) {
            return {
                totalReviews: 0,
                completedReviews: 0,
                pendingReviews: 0,
                declinedReviews: 0,
                completionRate: 0,
                averageScore: null
            };
        }

        const applicationIds = await Application
            .find({
                project: {
                    $in: ids
                }
            })
            .select("_id")
            .lean();

        const appIds = applicationIds.map(app => app._id);

        if (!appIds.length) {
            return {
                totalReviews: 0,
                completedReviews: 0,
                pendingReviews: 0,
                declinedReviews: 0,
                completionRate: 0,
                averageScore: null
            };
        }

        const [result] = await Reviewer.aggregate([

            {
                $match: {
                    application: {
                        $in: appIds
                    }
                }
            },

            {
                $group: {
                    _id: null,

                    totalReviews: {
                        $sum: 1
                    },

                    completedReviews: {
                        $sum: {
                            $cond: [
                                {
                                    $in: [
                                        "$status",
                                        [
                                            ReviewerStatus.submitted,
                                            ReviewerStatus.approved
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
                                    $eq: [
                                        "$status",
                                        ReviewerStatus.pending
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
                                {
                                    $eq: [
                                        "$status",
                                        ReviewerStatus.rejected
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    averageScore: {
                        $avg: "$score"
                    }
                }
            }
        ]);

        if (!result) {
            return {
                totalReviews: 0,
                completedReviews: 0,
                pendingReviews: 0,
                declinedReviews: 0,
                completionRate: 0,
                averageScore: null
            };
        }

        return {
            totalReviews: result.totalReviews,
            completedReviews: result.completedReviews,
            pendingReviews: result.pendingReviews,
            declinedReviews: result.declinedReviews,

            completionRate:
                result.totalReviews > 0
                    ? Number(
                        (
                            result.completedReviews /
                            result.totalReviews
                            * 100).toFixed(2)
                    )
                    : 0,

            averageScore:
                result.averageScore !== null
                    ? Number(result.averageScore.toFixed(2))
                    : null
        };
    }

    async getFinancial(
        filter: IReportFilter
    ) {

        const match: Record<string, any> = {};

        if (filter.fundingSource) {
            match.fundingSource = filter.fundingSource;
        }

        const [result] = await Grant.aggregate([
            { $match: match },

            {
                $group: {
                    _id: null,

                    totalGrantAmount: {
                        $sum: "$amount"
                    },

                    usedGrantBudget: {
                        $sum: "$usedBudget"
                    },

                    internalFunding: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$fundingSource",
                                        FundingSource.INTERNAL
                                    ]
                                },
                                "$amount",
                                0
                            ]
                        }
                    },

                    externalFunding: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$fundingSource",
                                        FundingSource.EXTERNAL
                                    ]
                                },
                                "$amount",
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        if (!result) {
            return {
                totalGrantAmount: 0,
                usedGrantBudget: 0,
                remainingGrantBudget: 0,
                utilizationRate: 0,
                internalFunding: 0,
                externalFunding: 0
            };
        }

        const remaining =
            result.totalGrantAmount -
            result.usedGrantBudget;

        return {
            totalGrantAmount: result.totalGrantAmount,
            usedGrantBudget: result.usedGrantBudget,
            remainingGrantBudget: remaining,

            utilizationRate:
                result.totalGrantAmount > 0
                    ? Number(
                        (
                            result.usedGrantBudget /
                            result.totalGrantAmount *
                            100
                        ).toFixed(2)
                    )
                    : 0,

            internalFunding: result.internalFunding,
            externalFunding: result.externalFunding
        };
    }

    async getPhases(
        projectMatch: Record<string, any>
    ) {

        const projectIds = await Project
            .find(projectMatch)
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
                                        PhaseStatus.terminated
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

    async getDepartments(
        projectMatch: Record<string, any>
    ) {

        return Project.aggregate([

            {
                $match: projectMatch
            },

            {
                $lookup: {
                    from: "users",
                    localField: "leadPI",
                    foreignField: "_id",
                    as: "pi"
                }
            },

            {
                $unwind: "$pi"
            },

            {
                $lookup: {
                    from: COLLECTIONS.ORGANIZATION,
                    localField: "pi.workspace",
                    foreignField: "_id",
                    as: "department"
                }
            },

            {
                $unwind: "$department"
            },

            {
                $match: {
                    "department.type": "department"
                }
            },

            {
                $group: {
                    _id: "$department._id",
                    name: {
                        $first: "$department.name"
                    },
                    count: {
                        $sum: 1
                    }
                }
            },

            {
                $project: {
                    _id: 0,
                    organization: "$_id",
                    name: 1,
                    count: 1
                }
            },

            {
                $sort: {
                    count: -1
                }
            }

        ]);
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
