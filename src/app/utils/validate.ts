import {Request, Response} from "express";
import Joi, {Err} from "joi";
import {Prisma} from "@prisma/client";

export const JoiOrPrismaError = (res: Response, req: Request, err: Err): boolean => {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // @ts-ignore
        res.status(403).send({[err.meta['target'] || "error"]: err.message.replace("prisma.", "").replace(/[^a-zA-Z\\d\\s:]/, "")});
        console.log(typeof err.message, err.message);
        res.end();
        return true;
    } else if (err instanceof Joi.ValidationError) {
        const {path, message} = err['details'][0];
        res.status(404).json({[path[0]]: message})
        res.end();
        return true;
    }
    return false;
}
