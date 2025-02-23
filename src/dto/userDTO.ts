class UserDTO {
    id: number;
    fullname: string;
    email: string;
    avatar: string | null;
    currency: string | null;

    constructor(id: number, fullname: string, email: string, avatar: string | null, currency: string | null) {
        this.id = id;
        this.fullname = fullname;
        this.email = email;
        this.avatar = avatar;
        this.currency = currency;
    }
}

export default UserDTO;