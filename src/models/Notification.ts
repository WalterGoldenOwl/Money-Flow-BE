class Notification {
    user_id: number;
    category_id: number;
    from_category_id: number | null;
    transaction_id: number;
    type: string;

    constructor(
        user_id: number,
        category_id: number,
        transaction_id: number,
        type: string,
        from_category_id: number | null = null,
    ) {
        this.user_id = user_id;
        this.category_id = category_id;
        this.from_category_id = from_category_id;
        this.transaction_id = transaction_id;
        this.type = type;
    }
}

export default Notification;