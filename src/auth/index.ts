import {Request, Response, Router} from "express";
import Joi from "joi";
import bcrypt from "bcryptjs";
import config from "config";
import {PrismaClient, Prisma} from '@prisma/client'

import {DateTime} from "luxon";
import {UserMini} from "../app/helpers/interfaces";
import {processSql, processStructure} from "../app/features/query";
import {isAxiosErrorRes} from "../app/utils/http";
import {cookieProps} from "../shared/constants";
import {JwtService} from "../shared/JwtService";
import StatusCodes from "http-status-codes";
import {authMw} from "../routes/middleware";

const Auth = Router();
const {zone} = config.get("Time");
const dateTime = DateTime.now().setZone(zone);

const jwtService = new JwtService();
const prismaClient = new PrismaClient();
const {BAD_REQUEST, OK, UNAUTHORIZED} = StatusCodes;

const validate = async (res: Response, {email, password}: UserMini): Promise<UserMini | undefined> => {
    try {
        const schema = Joi.object({
            email: Joi.string()
                .required()
                .email({minDomainSegments: 2, tlds: {allow: ['com', 'net']}})
                .label("Email"),
            password: Joi.string()
                .required()
                .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
                .min(6)
                .label("Password")

        });
        let user = await schema.validateAsync({email, password});

        let emailParts = email.split("@");
        if (emailParts.length !== 2) {
            res.status(404);
            res.json({email: "Format not allowed",});
            return undefined;
        }

        const {emails} = config.get("Auth.encrypt");
        if (!emails.includes(emailParts[1])) {
            res.status(404);
            res.json({email: "Domain not allowed",});
            return undefined;
        }

        return user;
    } catch (err) {
        const e: Joi.ValidationError = err;
        let message = e.details[0].message.replace("\"", "").replace("\"", "");
        res.status(404).send({[e.details[0].path[0].toString().toLowerCase()]: message});
        res.end()
        return;
    }
}

Auth.all("/", (req: Request, res: Response) => {
    res.send("Not allowed");
    res.end()
    return;
});

Auth.post("/register", (async (req, res) => {
    const {email, password, name} = req.body;

    try {
        const value = await validate(res, {email, password});
        if (!value) return;
        const {salt} = config.get("Auth.encrypt");

        let userExists = await prismaClient.user.findFirst({
            where: {
                email
            },
            select: {
                id: true,
            }
        });

        if (userExists) {
            res.status(404).send({email: "User already exists."});
            res.end();
            return;
        }

        let hash = bcrypt.hashSync(password, salt,);
        console.log(hash);

        let user = await prismaClient.user.create({
            select: {
                id: true,
                email: true,
                name: true,
                isActive: true,
                roles: {
                    select: {
                        id: false,
                        partnerId: false,
                        userId: false,
                        dataAccurancy: true,
                        channel: true,
                        epg: true,
                        vod: true,
                        crudUsers: true,
                        reports: true,
                        marketing: true,
                        crudPartners: true,
                    }
                }
            },
            data: {
                email,
                password: hash,
                name
            }
        });
        if (!user.roles) {
            user.roles = await prismaClient.role.create({
                data: {
                    User: {
                        connect: {
                            id: user.id
                        }
                    }
                }, select: {
                    id: false,
                    partnerId: false,
                    userId: false,
                    dataAccurancy: true,
                    channel: true,
                    epg: true,
                    vod: true,
                    crudUsers: true,
                    reports: true,
                    marketing: true,
                    crudPartners: true,
                }
            });
        }
        res.json(user);
        res.end();

    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // @ts-ignore
            res.status(403).send({"error": err.message.replace("prisma.", "").replace(/[^a-zA-Z\\d\\s:]/, "")});
            console.log(typeof err.message, err.message);
            res.end();
            return;
        }

        let error = err as Error;
        console.log(err);
        res.status(400).send({error: err || "Could not process."});
        res.end();
    }
}))

Auth.post("/login", async (req, res) => {
    const {email, password} = req.body;
    try {
        const value = await validate(res, {email, password});
        if (!value) return;

        let userExists = await prismaClient.user.findFirst({
            where: {
                email
            },
            select: {
                id: true,
                email: true,
                password: true,
                isActive: true,
                perms: true,
                roles: {
                    select: {
                        id: true,
                    }
                }
            }
        });

        if (!userExists) {
            res.status(404).send({email: "User not found"});
            res.end();
            return;
        }

        let passwordCorrect = bcrypt.compareSync(password, userExists.password);
        if (!passwordCorrect) {
            res.status(404).send({error: "Password incorrect"});
            res.end();
            return;
        }

        if (!userExists.isActive) {
            res.status(403).send({error: "Forbidden"});
            res.end();
            return;
        }

        if (!userExists.roles) {
            // @ts-ignore
            userExists.roles = await prismaClient.role.create({
                data: {
                    User: {
                        connect: {
                            id: userExists.id
                        }
                    }
                }, select: {
                    id: false,
                    partnerId: false,
                    userId: false
                }
            });
        }

        // @ts-ignore
        delete userExists.password;
        // @ts-ignore
        delete userExists.id;

        // Setup Admin Cookie
        const jwt = await jwtService.getJwt({
            ...userExists,
            ip: req.ip,
            createdAt: new Date().getTime(),
            modifiedAt: new Date().getTime(),
        });
        // const {key, options} = cookieProps;
        // res.cookie(key, jwt, options);
        // Return
        return res.status(OK).send(jwt).end();

    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // @ts-ignore
            res.status(403).send({"error": err.message.replace("prisma.", "").replace(/[^a-zA-Z\\d\\s:]/, "")});
            console.log(typeof err.message, err.message);
            res.end();
            return;
        }

        let error = err as Error;
        console.log(err);
        res.status(400).send({
            error: err || "Could not process."
        });
        res.end();
    }

})

Auth.post("/list", authMw, async (req, res) => {

    let sql = "SELECT channels_name as name, channels_id as id,channels_logo as logo FROM channels WHERE channels_active = 1";

    try {
        let millis = dateTime.toMillis();
        let {data} = await processSql(millis, millis, sql)
        const channels = processStructure(data);

        // console.log(channels)
        //
        res.json(channels);
        res.end();

    } catch (e) {
        if (e.isAxiosError) {
            isAxiosErrorRes(e, res);
            return;
        }
        console.log(e);
        res.status(404).send({error: "could not process"})
    }

})

Auth.post("/stats", (req, res) => {
    res.json({auth: ""});
})

Auth.post("logout", authMw, (req: Request, res: Response) => {
    const {key, options} = cookieProps;
    res.clearCookie(key, options);
    return res.status(OK).end();
})

export default Auth;