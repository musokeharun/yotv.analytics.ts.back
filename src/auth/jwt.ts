import Jwt, {JwtPayload, SignOptions} from "jsonwebtoken";
import config from "config";

const {secret} = config.get("Auth.jwt");

export const create = (data: JwtPayload) => {
    return Jwt.sign({...data}, secret)
}
export const createExpiry = (data: JwtPayload, expiry: string) => {
    return Jwt.sign({...data}, secret, {
        expiresIn: expiry
    })
}
export const verify = (token: string) => {
    return Jwt.verify(token, secret);
}
