class CategoryDTO {
    id: number;
    name: string;
    icon: string;
    type: string;

    constructor(
        id: number,
        name: string,
        icon: string,
        type: string
    ) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.type = type;
    }
}

export default CategoryDTO;