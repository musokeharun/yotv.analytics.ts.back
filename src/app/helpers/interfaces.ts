export interface UserMini {
    email: string
    password: string
}

export interface PartnerToken {
    "name": string,
    "isActive": boolean,
    "img"?: string,
    mwId?: string,
    "id": number,
    "iat"?: number,
    "exp"?: number
}

export interface UserMain extends UserMini {
    id: string,
    isActive: string,
    perms?: string,
    roles?: string,
}