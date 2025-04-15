class UserDTO {
    id: number;
    fullname: string;
    email: string;
    avatar: string | null;
    currency: string | null;
    country: string | null;
    language: string | null;

    constructor(id: number, fullname: string, email: string, avatar: string | null, currency: string | null, country: string | null, language: string | null) {
        this.id = id;
        this.fullname = fullname;
        this.email = email;
        this.avatar = avatar;
        this.currency = currency;
        this.country = country;
        this.language = language;
    }
}

export default UserDTO;