class TransactionReportDTO {
    income: number;
    expense: number;

    constructor(
        income: number,
        expense: number,
    ) {
        this.income = income;
        this.expense = expense;
    }
}

export default TransactionReportDTO;