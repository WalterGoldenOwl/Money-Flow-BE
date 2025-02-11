class UserDTO {
    id: number;
    fullname: string;
    email: string;

    constructor(id: number, fullname: string, email: string) {
        this.id = id;
        this.fullname = fullname;
        this.email = email;
    }
}

export default UserDTO;