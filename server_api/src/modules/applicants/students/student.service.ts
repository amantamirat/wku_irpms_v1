import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../util/delete.dto";
import { CalendarRepository } from "../../calendar/calendar.repository";
import { OrganizationRepository } from "../../organization/organization.repository";
import { Unit } from "../../organization/organization.type";
import { ApplicantRepository } from "../applicant.repository";
import { CreateStudentDTO, GetStudentsOptions, UpdateStudentDTO } from "./student.dto";
import { StudentRepository } from "./student.repository";

export class StudentService {

    constructor(
        private readonly repository: StudentRepository,
        private readonly calendarRepository: CalendarRepository,
        private readonly programRepository: OrganizationRepository,
        private readonly applicantRepository: ApplicantRepository
    ) { }

    async create(dto: CreateStudentDTO) {
        const { calendar, applicant, program } = dto;
        const calendarDoc = await this.calendarRepository.findById(calendar);
        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);

        const applicantDoc = await this.applicantRepository.findOne({ id: applicant });
        if (!applicantDoc) throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);

        const programDoc = await this.programRepository.findById(program);
        if (!programDoc) throw new AppError(ERROR_CODES.PROGRAM_NOT_FOUND);
        if (programDoc.type !== Unit.Program) throw new AppError(ERROR_CODES.INVALID_ORGANIZATION_TYPE);

        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            // 5. Handle unique index violations
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.STUDENT_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async get(options: GetStudentsOptions) {
        if (options.applicant) {
            return await this.repository.findByApplicant(options.applicant);
        }
        return await this.repository.findAll();
    }

    async update(dto: UpdateStudentDTO) {
        const { id, data } = dto;

        // 1. Ensure student exists
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new AppError(ERROR_CODES.STUDENT_NOT_FOUND);
        }

        // 2. Validate calendar (if provided)
        if (data.calendar) {
            const calendarDoc = await this.calendarRepository.findById(data.calendar);
            if (!calendarDoc) {
                throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
            }
        }

        // 3. Validate applicant (if provided)
        if (data.applicant) {
            const applicantDoc = await this.applicantRepository.findOne({ id: data.applicant });
            if (!applicantDoc) {
                throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);
            }
        }

        // 4. Validate program (if provided)
        if (data.program) {
            const programDoc = await this.programRepository.findById(data.program);
            if (!programDoc) {
                throw new AppError(ERROR_CODES.PROGRAM_NOT_FOUND);
            }
        }

        // 5. Update student
        try {
            const updated = await this.repository.update(id, data);
            if (!updated) {
                // Defensive: should not happen due to step 1
                throw new AppError(ERROR_CODES.STUDENT_NOT_FOUND);
            }
            return updated;
        } catch (err: any) {
            // 6. Handle unique index violations
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.STUDENT_ALREADY_EXISTS);
            }
            throw err;
        }
    }


    async delete(dto: DeleteDto) {
        const { id } = dto;
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new AppError(ERROR_CODES.STUDENT_NOT_FOUND);
        return deleted;
    }
}
