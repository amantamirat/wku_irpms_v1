import { createEntityManager } from "@/components/createEntityManager";
import { Result, GetResultsOptions } from "../models/result.model";
import { ResultApi } from "../api/result.api";
import { Reviewer } from "../../models/reviewer.model";
import { Criterion, FormType } from "@/app/(main)/evaluations/models/criterion.model";
import SaveResult from "./SaveResult";

interface ResultManagerProps {
    reviewer: string | Reviewer;
}

const ResultManager = ({ reviewer }: ResultManagerProps) => {

    /* --------------------------------------------
       Helpers
    --------------------------------------------- */
    /**
     *const totalWeight = useMemo(() => { return results.reduce((sum, r) => { const weight = (r.criterion as any)?.weight ?? 0; return sum + weight; }, 0); }, [results]); 
     const totalScore = useMemo(() => { return results.reduce((sum, row) => { const criterion = row.criterion as Criterion; if (!criterion) return sum; // closed form → option score if (criterion.formType === FormType.NUMBER) { const opt = row.selectedOption as any; return sum + (typeof opt?.score === "number" ? opt.score : 0); } // open form → direct score return sum + (typeof row.score === "number" ? row.score : 0); }, 0); }, [results]);
     */
    const getSelectedOptions = (row: Result) => {
        const criterion = row.criterion as Criterion;
        if (!criterion || !row.selectedOptions) return [];

        const ids = row.selectedOptions.map((opt: any) =>
            typeof opt === "object" ? opt._id : opt
        );

        return criterion.options?.filter((opt) =>
            ids.includes(opt._id)
        ) || [];
    };

    const scoreTemplate = (row: Result) => {
        const criterion = row.criterion as Criterion;
        if (!criterion) return "-";

        // OPEN → no score
        if (criterion.formType === FormType.OPEN) {
            return "-";
        }

        // NUMBER → direct score
        if (criterion.formType === FormType.NUMBER) {
            return row.score ?? "-";
        }

        // SINGLE / MULTIPLE → show selected options
        const selected = getSelectedOptions(row);

        if (selected.length === 0) return "-";

        return selected
            .map((opt) => `${opt.title} (${opt.score})`)
            .join(", ");
    };

    const Manager = createEntityManager<Result, GetResultsOptions | undefined>({
        title: "Manage Results",
        itemName: "Result",
        api: ResultApi,
        columns: [
            { header: "Criterion", field: "criterion.title" },
            {
                header: "Weight",
                field: "criterion.weight",
            },
            {
                header: "Score",
                field: "score",
                body: (row: Result) => scoreTemplate(row),
            },
            { header: "Comment", field: "comment" }
        ],
        query: () => ({
            reviewer: reviewer,
        }),
        SaveDialog: SaveResult,
        permissionPrefix: "result"
    });

    return <Manager />;
};

//export default ResultManager;