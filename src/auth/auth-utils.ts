import {PrismaClient} from "@prisma/client";

export const getRoles = (): Array<number> => {
    let array = new Array(8);
    return array.fill(1);
}

export const getRolesObject = (): Object => {
    let array = new Array(8);
    return array.fill(1);
}

export const digestRoles = async (roles: Array<number | string>) => {
    const prismaClient = new PrismaClient();
    let roleStruct = await prismaClient.$queryRaw("DESC role");
    return roleStruct.slice(3).map(({Field, Type}: any, index: number) => {
        return {
            [Field]: roles[index] || (Type.toLowerCase().startsWith("int") ? 1 : "")
        }
    }).reduce((acc: any, cur: any) => {
        acc[Object.keys(cur)[0]] = Object.values(cur)[0]
        return acc;
    }, {});
}