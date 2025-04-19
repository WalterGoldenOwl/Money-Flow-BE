class UserDTO {
    id: number;
    fullname: string;
    email: string;
    avatar: string | null;
    currency: string | null;
    country: string | null;
    language: string | null;
    is_need_password: boolean;

    constructor(id: number, fullname: string, email: string, avatar: string | null, currency: string | null, country: string | null, language: string | null, is_need_password: boolean) {
        this.id = id;
        this.fullname = fullname;
        this.email = email;
        this.avatar = avatar;
        this.currency = currency;
        this.country = country;
        this.language = language;
        this.is_need_password = is_need_password;
    }
}

export default UserDTO;