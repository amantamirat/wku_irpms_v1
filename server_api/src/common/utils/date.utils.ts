
const MS_PER_DAY = 1000 * 60 * 60 * 24;
export function calculateDurationDays(
    startDate: Date | string,
    endDate: Date | string
): number {

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - start.getTime();

    if (diffTime < 0) {
        return 0;
    }

    return Math.ceil(
        diffTime / MS_PER_DAY
    ) + 1;
};


export function formatDate(
    value: Date | string | number | undefined | null
): string {

    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}