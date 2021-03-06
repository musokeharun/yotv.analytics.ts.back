import jsonwebtoken, {VerifyErrors} from 'jsonwebtoken';
import {cookieProps} from './constants';
import config from "config";

const {secret} = config.get("Auth.jwt");
let expiresIn = "24h";


interface IOptions {
    expiresIn: string;
}

export class JwtService {

    private readonly secret: string;
    private readonly options: IOptions;
    private readonly VALIDATION_ERROR = 'JSON-web-token validation failed.';


    constructor() {
        this.secret = secret;
        this.options = {expiresIn: expiresIn};
    }


    /**
     * Encrypt data and return jwt.
     *
     * @param data
     */
    public getJwt(data: any): Promise<string> {
        return new Promise((resolve, reject) => {
            jsonwebtoken.sign(data, this.secret, this.options, (err, token) => {
                err ? reject(err) : resolve(token || '');
            });
        });
    }


    /**
     * Decrypt JWT and extract client data.
     *
     * @param jwt
     */
    public decodeJwt(jwt: string): Promise<any> {
        return new Promise((res, rej) => {
            jsonwebtoken.verify(jwt, this.secret, (err: VerifyErrors | null, decoded?: object) => {
                console.log("Errors", err);
                return err ? rej(this.VALIDATION_ERROR) : res(decoded);
            });
        });
    }
}
