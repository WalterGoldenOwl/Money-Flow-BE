class Notification {
    user_id: number;
    category_id: number;
    transaction_id: number;
    type: string;

    constructor(
        user_id: number,
        category_id: number,
        transaction_id: number,
        type: string
    ) {
        this.user_id = user_id;
        this.category_id = category_id;
        this.transaction_id = transaction_id;
        this.type = type;
    }
}

export default Notification;