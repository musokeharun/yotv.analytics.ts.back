import StatusCodes from 'http-status-codes';
import {Request, Response, NextFunction} from 'express';

import {cookieProps} from '../shared/constants';
import {JwtService} from '../shared/JwtService';
import {PrismaClient} from "@prisma/client";
import {PartnerToken} from "../app/helpers/interfaces";
import {verify} from "../auth/jwt";
import {JsonWebTokenError, TokenExpiredError} from "jsonwebtoken";

const jwtService = new JwtService();
const {UNAUTHORIZED} = StatusCodes;
const prismaClient = new PrismaClient();


// Middleware to verify if user is logged in
export const authMw = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get json-web-token
        let headers = req.headers;
        const jwt = (headers["x-admin-stats-token"] || "").toString();
        console.log(jwt);
        if (!jwt) {
            throw Error('User forbidden.');
        }
        // Make sure user is logged in
        const clientData = await jwtService.decodeJwt(jwt);
        console.log(clientData);
        if (!!clientData) {

            let userExists = await prismaClient.user.findFirst({
                where: {
                    email: clientData.email,
                },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    isActive: true,
                    perms: true,
                    roles: true
                }
            });

            if (!userExists) {
                res.send({user: "User not found"}).status(404).end();
                return;
            }

            if (!userExists.isActive) {
                res.send({user: "User not active"}).status(404).end();
                return;
            }

            // TODO GET ROLES OBJECT
            res.locals.user = userExists;
            //console.log("Roles", userExists.roles);

            next();
        } else {
            throw Error('User not authenticated.');
        }
    } catch (err) {
        console.log("Error", err);
        return res.status(UNAUTHORIZED).json({
            error: err.message,
        });
    }
};

export const authPartner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let {"x-partner-stats-token": token} = req.headers;
        if (!token) {
            res.status(403).send({error: "no such user found"}).end();
            return;
        }

        let payload = <PartnerToken>verify(<string>token);

        let partnerExists = await prismaClient.partner.findFirst({
            where: {
                name: payload.name,
            },
            select: {
                id: true,
                isActive: true,
                mwId: true,
                roles: true,
                name: true
            }
        });

        if (!partnerExists) {
            res.send({error: "Partner not found"}).status(404).end();
            return;
        }

        if (!partnerExists.isActive) {
            res.send({error: "Partner not active"}).status(404).end();
            return;
        }

        // TODO GET ROLES OBJECT
        res.locals.partner = partnerExists;
        //console.log("Roles", partnerExists.roles);
        next();

    } catch (e) {

        if (e instanceof TokenExpiredError) {
            const {name, message, expiredAt} = e;
            res.status(403).send({error: "Token expired,Please contact administrator."});
            res.end()
            return;
        } else if (e instanceof JsonWebTokenError) {
            const {name, message} = e;
            res.status(403).send({error: "Token not allowed,Please contact administrator."});
            res.end()
            return;
        }

        console.log("Token Error", e)
        res.status(404).send({error: "Could not process"});
        res.end();
        return;
    }
}