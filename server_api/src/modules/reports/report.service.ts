import { ReportRepository } from "./report.repository";
import { OverviewFilterDTO, InstitutionalOverviewDTO } from "./report.dto";
import { ProjectStatus } from "../projects/project.state-machine";

export class ReportService {
    constructor(private readonly reportRepo = new ReportRepository()) {}

    async getInstitutionalOverview(filter: OverviewFilterDTO): Promise<InstitutionalOverviewDTO> {
        const result = await this.reportRepo.getInstitutionalOverview(filter);
        const data = result[0];

        const totalProjects = data.totalProjects[0]?.count || 0;
        const totalFunding = data.totalFunding[0]?.total || 0;

        const statusMap: Record<string, number> = {};
        for (const item of data.statusDistribution) {
            statusMap[item._id] = item.count;
        }

        const submitted = statusMap[ProjectStatus.submitted] || 0;
        const granted = statusMap[ProjectStatus.granted] || 0;
        //const ongoing = statusMap["ongoing"] || 0;
        const completed = statusMap["completed"] || 0;
        const published = statusMap["published"] || 0;

        const grantSuccessRate = totalProjects === 0 ? 0 : (granted / totalProjects) * 100;
        const completionRate = granted === 0 ? 0 : (completed / granted) * 100;
        const publicationRate = completed === 0 ? 0 : (published / completed) * 100;

        return {
            totalProjects,
            submittedProjects: submitted,
            grantedProjects: granted,
           // ongoingProjects: ongoing,
            completedProjects: completed,
            publishedProjects: published,
            totalFundingSecured: totalFunding,
            grantSuccessRate,
            completionRate,
            publicationRate
        };
    }
}
