import CategoryDTO from './CategoryDTO';

class NotificationDTO {
    id: number;
    type: string;
    transaction_id: number;
    category: CategoryDTO;
    is_read: boolean;
    created_at: String;
    updated_at: String;

    constructor(
        id: number,
        type: string,
        category: CategoryDTO,
        transaction_id: number,
        is_read: boolean,
        created_at: String,
        updated_at: String,
    ) {
        this.id = id;
        this.transaction_id = transaction_id;
        this.type = type;
        this.category = category;
        this.is_read = is_read;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

export default NotificationDTO;