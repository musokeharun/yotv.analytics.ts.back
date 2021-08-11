import {PrismaClient} from "@prisma/client";

const prismaClient = new PrismaClient();

export const logger = async (type: LogType, logCode: LogCode, param: string, userId?: number, partnerId?: number, logCode2?: number, param2?: any) => {
    try {
        console.log(type, logCode)
        return await prismaClient.log.create({
            data: {
                type: type.toString(),
                userId,
                partnerId,
                param2,
                param,
                logCode,
                logCode2
            },
            select: {
                id: true
            }
        });
    } catch (e) {
        console.log("Error", e)
        return "";
    }
}

export enum LogType {
    LOGIN,
    REGISTER,
    PENDING,
    SUCCESS,
    FAILURE,
    WAITING
}

export enum LogCode {
    SUCCESS = 200,
    PENDING = 300,
    WAITING = 400,
    FAILURE = 500
}