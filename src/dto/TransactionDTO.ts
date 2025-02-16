import CategoryDTO from './CategoryDTO';

class TransactionDTO {
    id: number;
    description: string;
    attachment: string;
    amount: number;
    category: CategoryDTO;
    created_at: String;
    updated_at: String;
    date_created: String;

    constructor(
        id: number,
        description: string,
        attachment: string,
        category: CategoryDTO,
        amount: number,
        created_at: String,
        updated_at: String,
        date_created: String,
    ) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.attachment = attachment;
        this.category = category;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.date_created = date_created;
    }
}

export default TransactionDTO;