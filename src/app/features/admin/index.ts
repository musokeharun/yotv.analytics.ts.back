import {Router} from "express";
import config from "config";
import {DateTime} from "luxon";
import Joi from "joi";
import {JoiOrPrismaError} from "../../utils/validate";
import {DeviceType, FieldType, Interval, StreamType, Type, Vendor} from "../datasource/datasource-utils";
import {enumAllValues, otherConstData, processBucket, processData} from "../datasource";
import {cache, get} from "../../helpers/cache/cache";
import {processAndResult} from "../query";
import {getChannelIds} from "../query/query-utils";
import {Dashboard} from "../apps/dashboard";
import {Realtime} from "../apps/realtime";
import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";
import Funnel from "../apps/funnel";
import {getDurationObject} from "../../../shared/constants";
import {createExpiry, verify} from "../../../auth/jwt";
import {digestRoles} from "../../../auth/auth-utils";
import {authMw} from "../../../routes/middleware";
import {getDateTimeNow} from "../../../shared/functions";

const prismaClient = new PrismaClient();

const Admin = Router();

const dateTime = getDateTimeNow();
let secondsToExpire = (30 * 60);

const {salt} = config.get("Auth.encrypt");

const getType = (type: string): string => {
    switch (type) {
        case "devices":
            return FieldType.DEVICE_TYPE;
        case "cast":
            return FieldType.TYPE;
        case "stream":
            return FieldType.STREAM_TYPE;
        default:
            return FieldType.CHANNELS;
    }

}

export const getDataSource = async (channels: Array<string>, from: DateTime, to: DateTime, interval: string, field: string, cardinality: string, roles?: any) => {

    let payload = otherConstData(
        channels,
        enumAllValues(Vendor),
        enumAllValues(DeviceType),
        enumAllValues(Type),
        enumAllValues(StreamType, (roles && !roles.dataAccurancy) ? StreamType.VOD : ""),
        (from.toMillis()).toString(),
        (to.toMillis()).toString(),
        interval,
        field,
        !!cardinality,
        true,
        FieldType.TIMESTAMP,
        cardinality
    );

    let key = `${channels.toString()}_${from.toMillis()}_${to.toMillis()}_${interval}_${field}_${cardinality || ""}`;
    let dataSourced: any = get(key);
    if (!dataSourced) {
        let dataSourceVar = await processData(payload);
        dataSourced = dataSourceVar ? dataSourceVar.map((d: any) => processBucket(d)) : [];
        cache(key, dataSourced, secondsToExpire).then(r => console.log(key + "  Cached"));
    }
    return dataSourced;
}

const getRangeEpg = async (from: number, to: number, channels: Array<string>) => {

    let ids = await getChannelIds(dateTime, channels);
    // CURRENT EPG
    let key = `${from}_${to}_${channels.toString()}`;
    let result: any = get(key);
    if (!result) {
        result = await processAndResult(from, to, `select epg_events_id AS id,epg_events_start as start,epg_events_end as end,channels_name as channel,epg_events_title as title,epg_events_duration as duration from epg_events left join channels on epg_events_channels_id=channels_id where epg_events_channels_id IN(${ids}) AND epg_events_start between '${DateTime.fromMillis(from).toSQL({
            includeOffset: false,
            includeZone: false
        })}' AND '${DateTime.fromMillis(to).toSQL({includeOffset: false, includeZone: false})}';`);
        cache(key, result, secondsToExpire).then(() => console.log("Cached" + key))
    } else
        console.log("Served From Cache")
    return result;

}

Admin.all("/", ((req, res) => {
    res.send("Admin on board");
}))

Admin.post("/epg", authMw, async (req, res) => {

    try {
        const schema = Joi.object({
            from: Joi.number()
                .required()
                .label("Start Date"),
            to: Joi.number()
                .label("End Date"),
            channels: Joi.string()
                .required()
                .label("Channel")
        });

        //TODO GET POST
        let {from, to, channels} = await schema.validateAsync(req.body);
        let channelsArray = channels.split(",");

        let epg = await getRangeEpg(from, to, channelsArray);
        console.log(epg);

        res.send(epg).end();

    } catch (err) {
        if (JoiOrPrismaError(res, req, err)) return;
        let error = err as Error;
        console.log(err);
        res.status(400).send({
            error: err || "Could not process."
        });
        res.end();
    }


})

Admin.post("/funnel", authMw, (async (req, res) => {

    const {user} = res.locals;

    try {
        const schema = Joi.object({
            from: Joi.number()
                .required()
                .label("Start Date"),
            to: Joi.number()
                .label("End Date"),
            channels: Joi.string()
                .required()
                .label("Channel"),
            type: Joi.allow("", null).label("Query type"),
            interval: Joi.allow("", null).label("Interval"),
            tamper: Joi.allow("", null).label("Interval"),
        });

        //TODO GET POST
        let {from, to, channels, type, interval, tamper} = await schema.validateAsync(req.body);

        let fromDateTime = DateTime.fromMillis(parseInt(from));
        let toDateTime = DateTime.fromMillis(parseInt(to));

        // if (!tamper) {
        //     fromDateTime = fromDateTime.startOf("day")
        //     toDateTime = toDateTime.endOf("day")
        // }

        const channelsArray = channels.split(",");
        let duration = toDateTime.diff(fromDateTime).toObject() || {};
        const durationObject = getDurationObject(parseInt(String(duration.milliseconds || 0)));


        let {
            thtPeriodInterval,
            thtPeriod
        } = await Funnel(interval, durationObject, channelsArray, type, fromDateTime, toDateTime);

        console.log(fromDateTime.toSQL(), toDateTime.toSQL(), dateTime.toSQL(), duration, channelsArray);
        res.json({
            data: thtPeriod,
            meta: {
                interval: thtPeriodInterval,
                ...duration
            }
        }).end();
        return;
    } catch (err) {
        if (JoiOrPrismaError(res, req, err)) return;
        let error = err as Error;
        console.log(err);
        res.status(400).send({
            "error": err || "Could not process."
        });
        res.end();
    }
}))

Admin.post("/realtime", authMw, async (req, res) => {

    const {list, count} = req.query;
    const {user} = res.locals;
    const {channel, type} = req.body;
    if (!channel) {
        res.send({error: "Channel is required"}).status(404).end();
        return;
    }

    try {

        let channels = channel.split(",");
        let fieldType = getType(type || "stream");
        if (channels.length > 1) {
            fieldType = FieldType.CHANNELS;
        }

        res.send("Working on it").status(400).end();
        return;

        let realtime = await Realtime(dateTime, channels, {
            list: !!list, count: !!count
        }, FieldType.STREAM_TYPE, user.roles);
        res.json(realtime);

    } catch (e) {
        if (e.message) {
            console.log(e);
            res.status(500).send({error: e.message});
            res.end();
            return
        }
        res.status(500).send({error: "Could not process"});
    }
})

Admin.post("/dashboard", authMw, async (req, res) => {

    const {channel, type} = req.body;
    const {user} = res.locals;

    if (!channel) {
        res.send({channel: "Channel is required"}).status(404).end();
        return;
    }

    try {
        let channels = channel.split(",");
        let fieldType = FieldType.STREAM_TYPE;
        if (channels.length > 1)
            fieldType = FieldType.CHANNELS;
        let data = await Dashboard(dateTime, channels, fieldType);

        res.json({yesterday: data.dataSourceYesterday, lastWeek: data.dataSourceLastWeek});
        return;
    } catch (e) {
        if (e.message) {
            res.status(500).send(e);
            res.end();
            return
        }
        res.status(500).send("Could not process");
    }
})

Admin.post("/partner/token", authMw, async (req, res) => {

    const {user} = res.locals;
    // TODO CHECK IF USER HAS CRUD PERMISSIONS
    if (!user.roles.crudPartners) {
        res.status(403).send({error: "user forbidden"}).end();
        return;
    }

    try {
        const {partner, expiry} = req.body;
        const schema = Joi.object({
            partner: Joi.number()
                .required()
                .label("Partner"),
            expiry: Joi.number()
                .required()
                .label("Expiry")
        });

        let partnerRequestAuthenticated = await schema.validateAsync({partner, expiry});
        let partnerChecked = await prismaClient.partner.findFirst({
            where: {
                id: parseInt(partner)
            },
            select: {
                isActive: true,
                name: true,
                id: true,
                img: true,
                mwId: true,
                token: true
            }
        });

        if (!partnerChecked) {
            res.status(403).send({error: "partner not found."}).end();
            return;
        }

        if (partnerChecked && !partnerChecked.isActive) {
            res.status(405).json({error: `${partnerChecked.name} not active.`}).end();
            return;
        }

        let now = dateTime.toMillis();
        let partnerUpdated = await prismaClient.partner.update({
            data: {
                token: now + "".trim()
            },
            where: {
                id: partnerChecked.id
            }
        })

        // @ts-ignore
        delete partnerChecked.id;


        // create token
        let expiresIn: string = (24 * Number(expiry)) + "h"
        let token = createExpiry({...partnerChecked, id: partnerUpdated.token}, expiresIn);

        res.type("application/octet-stream");
        res.attachment(`${partnerChecked.name.toLowerCase() + ".yotv.txt"}`);
        res.set('Content-disposition', `attachment; filename=${partnerChecked.name.toLowerCase() + ".yotv.txt"}`);
        res.send(token).end();

    } catch (err) {
        console.log(err);
        if (JoiOrPrismaError(res, req, err)) return;
        let error = err as Error;
        res.status(400).send({
            error: err || "Could not process."
        });
        res.end();
    }

});

Admin.post("/partner/save", authMw, (async (req, res) => {
    try {
        const {user} = res.locals;

        // TODO-CHECK-USER-CRUD-PARTNER-PERMISSION.
        if (!user.roles.crudPartners) {
            res.status(403).send({user: "user forbidden"}).end();
            return;
        }

        const {name, logo, isActive, roles} = req.body;

        const schema = Joi.object({
            name: Joi.string()
                .required()
                .label("Channel"),
            logo: Joi.string()
                .label("Logo"),
            isActive: Joi.number()
                .allow(null)
                .label("Status"),
            roles: Joi.string()
                .label("Roles"),
        });

        let partnerAuthenticated = await schema.validateAsync({name, logo, isActive, roles});

        let status = !!isActive;
        let updated = {img: null};
        if (partnerAuthenticated.logo) {
            updated.img = logo;
        } else {
            // @ts-ignore
            delete updated.img;
        }

        let channelFromMws = await getChannelIds(dateTime, [name], false);
        let mwId = parseInt(channelFromMws[0]);
        console.log("Channel", channelFromMws);


        if (roles && !roles.includes(",")) {
            res.status(403).send({error: "roles not found"}).end();
            return;
        }
        const digestedRoles = await digestRoles(!roles ? [] : roles.split(","));
        let partnerCreatedOrUpdates = await prismaClient.partner.upsert({
            where: {
                name
            },
            select: {
                name: true,
                isActive: true,
                img: true,
            },
            create: {
                name,
                isActive: status,
                mwId,
                img: logo,
                creator: {
                    connect: {
                        id: user.id
                    }
                },
                roles: {
                    create: {}
                }
            },
            update: {
                name,
                isActive: status,
                ...updated,
                mwId,
                updator: {
                    connect: {
                        id: user.id
                    }
                },
                roles: {
                    create: {
                        ...digestedRoles
                    }
                }
            }
        })

        res.json(partnerCreatedOrUpdates).end();

    } catch (err) {
        if (JoiOrPrismaError(res, req, err)) return;
        let error = err as Error;
        console.log(err);
        res.status(400).send({
            error: err || "Could not process."
        });
        res.end();
    }

}))

Admin.all("/partner/list", authMw, async (req, res) => {
    try {

        const {user} = res.locals;
        let query = <any>req.query;
        let page: number = query.page ? (<number>query.page) : 1;
        const pageNumber = 20;

        // TODO-CHECK-USER-CRUD-PARTNER-PERMISSION.
        if (!user.roles.crudPartners) {
            res.status(403).send({user: "user forbidden"}).end();
            return;
        }

        let partners = await prismaClient.partner.findMany({
            select: {
                id: true,
                name: true,
                isActive: true,
                img: true,
                roles: true
            },
            skip: ((page - 1) * pageNumber),
            take: pageNumber
        });

        res.json(partners).end();

    } catch (err) {
        if (JoiOrPrismaError(res, req, err)) return;
        let error = err as Error;
        console.log(err);
        res.status(400).send({
            error: err || "Could not process."
        });
        res.end();
    }
})

Admin.all("/users/list?", authMw, async (req, res) => {
    try {

        const {user} = res.locals;
        let query = <any>req.query;
        let page: number = query.page ? (<number>query.page) : 1;
        const pageNumber = 20;

        // TODO-CHECK-USER-CRUD-PARTNER-PERMISSION.
        if (!user.roles.crudUsers) {
            res.status(403).send({user: "user forbidden"}).end();
            return;
        }

        let partners = await prismaClient.user.findMany({
            select: {
                id: true,
                name: true,
                isActive: true,
                email: true,
                roles: true
            },
            skip: ((page - 1) * pageNumber),
            take: pageNumber
        });
        res.json(partners).end();

    } catch (err) {
        if (JoiOrPrismaError(res, req, err)) return;
        let error = err as Error;
        console.log(err);
        res.status(400).send({error: err || "Could not process."});
        res.end();
    }
})

Admin.post("/users/save", authMw, (async (req, res) => {
    try {
        const {user} = res.locals;

        // TODO-CHECK-USER-CRUD-PARTNER-PERMISSION.
        if (!user.roles.crudUsers) {
            res.status(403).send({user: "user forbidden"}).end();
            return;
        }

        const {email, password, isActive, userId, roles, name} = req.body;

        const schema = Joi.object({
            email: Joi.string()
                .required()
                .label("Email"),
            password: Joi.string()
                .allow(null)
                .min(6)
                .label("Password"),
            isActive: Joi.number()
                .required()
                .label("Status"),
            name: Joi.string()
                .allow(null)
                .label("Username"),
            userId: Joi.number()
                .required()
                .label("User")
        });

        let userAuthenticated = await schema.validateAsync({email, password, isActive, name});

        let userExists = await prismaClient.user.findUnique({
            where: {
                id: parseInt(userId)
            },
            select: {
                id: true,
                isActive: true
            }
        })
        if (!userExists) {
            res.status(404).send({error: "user doesn't exists"}).end();
            return;
        }// else if (!userExists.isActive) {
        // res.status(404).send({error: "user not active"}).end();
        //return;
        // }

        let status = !!isActive;
        let update = {password: "", name: ""};
        if (password) {
            update.password = bcrypt.hashSync(password, salt);
        } else {
            // @ts-ignore
            delete update.password;
        }

        if (name) {
            update.name = name;
        } else {
            // @ts-ignore
            delete update.name;
        }

        if (roles && !roles.includes(",")) {
            res.status(403).send({error: "roles not found"}).end();
            return;
        }
        let digestedRoles = await digestRoles(roles ? roles.split(",") : []);
        // console.log("Roles", digestedRoles);

        let userUpdated = await prismaClient.user.update({
            where: {
                id: parseInt(userId)
            },
            select: {
                email: true,
                isActive: true,
            },
            data: {
                email,
                isActive: status,
                ...update,
                roles: {
                    update: {
                        ...digestedRoles
                    }
                }
            }
        })
        res.json(userUpdated).end();

    } catch (err) {
        if (JoiOrPrismaError(res, req, err)) return;
        let error = err as Error;
        console.log(err);
        res.status(400).send({
            "error": err || "Could not process."
        });
        res.end();
    }

}))

export default Admin;