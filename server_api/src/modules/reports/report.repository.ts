
import { Project } from "../projects/project.model";
import { OverviewFilterDTO } from "./report.dto";

export class ReportRepository {

    async getInstitutionalOverview(filter: OverviewFilterDTO) {
        const projectMatch: any = {};

        // Optional date filter on project
        if (filter.startDate || filter.endDate) {
            projectMatch.createdAt = {};
            if (filter.startDate) projectMatch.createdAt.$gte = filter.startDate;
            if (filter.endDate) projectMatch.createdAt.$lte = filter.endDate;
        }

        return await Project.aggregate([
            // Step 1: Apply project-level filters (dates)
            { $match: projectMatch },

            // Step 2: Lookup the call document
            {
                $lookup: {
                    from: "calls",
                    localField: "call",
                    foreignField: "_id",
                    as: "callDoc"
                }
            },
            { $unwind: "$callDoc" },

            // Step 3: Apply filters on call fields
            {
                $match: {
                    ...(filter.call ? { "callDoc._id": filter.call } : {}),
                    ...(filter.grant ? { "callDoc.grant": filter.grant } : {}),
                    ...(filter.calendar ? { "callDoc.calendar": filter.calendar } : {}),
                    ...(filter.directorate ? { "callDoc.directorate": filter.directorate } : {}),
                }
            },

            // Step 4: Compute all KPIs in one $facet
            {
                $facet: {
                    totalProjects: [
                        { $count: "count" }
                    ],

                    statusDistribution: [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        }
                    ],

                    totalFunding: [
                        {
                            $match: {
                                status: {
                                    $in: ["granted",
                                        //"ongoing", 
                                        "completed", "published"]
                                }
                            }
                        },
                        { $group: { _id: null, total: { $sum: "$totalBudget" } } }
                    ]
                }
            }
        ]);
    }
}
