import { GetCompositionDTO, CreateCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { IComposition, Composition } from "./composition.model";


export interface ICompositionRepository {
    find(filters: GetCompositionDTO): Promise<IComposition[]>;
    findById(id: string): Promise<IComposition | null>;
    create(dto: CreateCompositionDTO): Promise<IComposition>;
    update(dto: UpdateCompositionDTO): Promise<IComposition>;
    delete(id: string): Promise<IComposition | null>;
}

export class CompositionRepository implements ICompositionRepository {

    async find(filters: GetCompositionDTO): Promise<IComposition[]> {
        const query: any = {};
        if (filters.constraint) query.constraint = filters.constraint;
        return Composition.find(query).exec();
    }

    async findById(id: string): Promise<IComposition | null> {
        return Composition.findById(id).exec();
    }

    async create(dto: CreateCompositionDTO): Promise<IComposition> {
        const doc = new Composition(dto);
        return await doc.save();
    }

    async update(dto: UpdateCompositionDTO): Promise<IComposition> {
        const { id, data } = dto;

        const updated = await Composition.findByIdAndUpdate(
            id,
            data,
            { new: true } // return updated doc
        ).exec();

        if (!updated) {
            throw new Error("Composition not found");
        }

        return updated;
    }

    async delete(id: string): Promise<IComposition | null> {
        return Composition.findByIdAndDelete(id).exec();
    }
}
