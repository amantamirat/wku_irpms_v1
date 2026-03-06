import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { IPhaseRepository, PhaseRepository } from "../phase.repository";
import { PhaseStatus } from "../phase.status";
import { CreatePhaseDocDTO, GetPhaseDocDTO } from "./phase.doc.dto";
import { IPhaseDocumentRepository, PhaseDocumentRepository } from "./phase.doc.repository";

export class PhaseDocService {

    private repository: IPhaseDocumentRepository;
    private phaseRepository: IPhaseRepository;

    constructor(repository?: IPhaseDocumentRepository, phaseRepository?: IPhaseRepository) {
        this.repository = repository || new PhaseDocumentRepository();
        this.phaseRepository = phaseRepository || new PhaseRepository();
    }

    async create(data: CreatePhaseDocDTO) {
        const { description, phase, documentPath } = data;

        const phaseDoc = await this.phaseRepository.findById(phase);
        if (!phaseDoc)
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        if (phaseDoc.status !== PhaseStatus.active)
            throw new AppError(ERROR_CODES.PHASE_NOT_ACTIVE);

        const created = await this.repository.create(data);
        return created;
    }

    async get(options: GetPhaseDocDTO) {
        const items = await this.repository.find(options);
        return items;
    }

    async delete(id: string) {
        const phaseDocDoc = await this.repository.delete(id);
        if (!phaseDocDoc) throw new AppError(ERROR_CODES.PHASE_DOCUMENT_NOT_FOUND);
        return phaseDocDoc;
    }
}
