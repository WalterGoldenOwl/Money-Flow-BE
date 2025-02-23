interface WeekRange {
    start: Date;
    end: Date;
}

export function getWeekRangesInMonth(startDate: Date): WeekRange[] {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    const weeks: WeekRange[] = [];

    let startOfWeek = new Date(firstDayOfMonth);
    let endOfWeek = new Date(firstDayOfMonth);

    if (startOfWeek.getUTCDay() === 0) {
        endOfWeek = new Date(startOfWeek);
    } else {
        endOfWeek.setUTCDate(endOfWeek.getUTCDate() + (7 - endOfWeek.getUTCDay()));
    }
    weeks.push({ start: new Date(startOfWeek), end: new Date(endOfWeek.setUTCHours(23, 59, 59, 999)) });

    startOfWeek.setUTCDate(endOfWeek.getUTCDate() + 1);
    while (startOfWeek <= lastDayOfMonth) {
        endOfWeek = new Date(startOfWeek);
        endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);

        if (endOfWeek > lastDayOfMonth) {
            endOfWeek = new Date(lastDayOfMonth);
        }

        weeks.push({ start: new Date(startOfWeek), end: new Date(endOfWeek.setUTCHours(23, 59, 59, 999)) });
        startOfWeek.setUTCDate(startOfWeek.getUTCDate() + 7);
    }

    return weeks;
}
