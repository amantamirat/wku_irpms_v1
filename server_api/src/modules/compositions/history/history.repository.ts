import { HistoryRule, IHistoryRule } from "./history.model";


export class HistoryRepository {

    async create(
        data: Partial<IHistoryRule>
    ) {
        return HistoryRule.create(data);
    }



    async findAll() {

        return HistoryRule
            .find()
            .sort({
                createdAt: -1
            });

    }



    async findById(id: string): Promise<IHistoryRule | null> {
        return HistoryRule.findById(id);
    }



    async update(
        id: string,
        data: Partial<IHistoryRule>
    ) {

        return HistoryRule.findByIdAndUpdate(
            id,
            data,
            {
                new: true
            }
        );

    }

    async delete(id: string) {

        return HistoryRule.findByIdAndDelete(id);

    }


}


