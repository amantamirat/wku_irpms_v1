import { GrantRepository, IGrantRepository } from "./grant.repository";

export class GrantValidator {
    private repository: IGrantRepository;
    
    constructor(repository?: IGrantRepository) {
        this.repository = repository || new GrantRepository();
    }

    //use flymode in here also
}