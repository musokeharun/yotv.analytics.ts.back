import {Router} from "express";
import {PrismaClient} from '@prisma/client'
import {DateTime} from "luxon";
import {JsonWebTokenError, TokenExpiredError} from "jsonwebtoken";
import config from "config";
import {PartnerToken} from "../../helpers/interfaces";
import {Realtime} from "../apps/realtime";
import {Dashboard} from "../apps/dashboard";
import {LogCode, logger, LogType} from "../../helpers/activity";
import {FieldType} from "../datasource/datasource-utils";
import {processAndResult} from "../query";
import Joi from "joi";
import Funnel from "../apps/funnel";
import {JoiOrPrismaError} from "../../utils/validate";
import {getDurationObject} from "../../../shared/constants";
import {verify} from "../../../auth/jwt";
import {authPartner} from "../../../routes/middleware";

const Partner = Router();
const prismaClient = new PrismaClient();
const {zone} = config.get("Time");
const dateTime = DateTime.now().setZone(zone);

Partner.all("/", (req, res) => res.status(403).json({msg: "Not Allowed", status: 403}));

//TODO, DO THE NECESSARY CHECKING
Partner.post("/login", async (req, res) => {

    const {token, name: sentName} = req.body;
    if (!token) {
        res.status(404).send({error: "channel not Found"})
        res.end()
        return;
    }

    try {
        const decoded = verify(token)
        const {name, id} = decoded as PartnerToken;

        if (name != sentName) {
            logger(LogType.FAILURE, LogCode.FAILURE, token).then(function () {
                console.log("Finished")
            });

            res.status(404).json({error: "No such channel found"});
            res.end();
            return;
        }

        let tokenPartner = await prismaClient.partner.findFirst({
            select: {
                id: true,
                name: true,
                isActive: true,
                img: true
            },
            where: {
                name,
                token: id + ""
            }
        })

        if (!tokenPartner) {

            logger(LogType.FAILURE, LogCode.FAILURE, token).then(function () {
                console.log("Finished")
            });

            res.status(404).json({error: "No such channel found,Contact Administration."});
            res.end();
            return;
        }

        if (!tokenPartner.isActive) {

            logger(LogType.FAILURE, LogCode.FAILURE, token).then(function () {
                console.log("Finished")
            });

            res.status(403).json({error: "Channel currently inactive,Contact Administration."});
            res.end();
            return;
        }

        logger(LogType.SUCCESS, LogCode.SUCCESS, token, undefined, tokenPartner.id).then(function () {
            console.log("Finished")
        });
        // @ts-ignore
        delete tokenPartner.id;
        res.json(token);
        return;
    } catch (e) {

        if (e instanceof TokenExpiredError) {
            const {name, message, expiredAt} = e;
            res.status(403).send({error: "Token expired,Contact Administration."});
            res.end()
            return;
        } else if (e instanceof JsonWebTokenError) {
            const {name, message} = e;
            res.status(403).send({token: "Token not allowed,Contact Administration."});
            res.end()
            return;
        }

        console.log("Token Error", e)
        res.status(404).send({error: "could not process"});
        res.end();
        return;
    }

})

Partner.all("/dashboard", authPartner, async (req, res) => {

    const {partner} = res.locals;

    try {
        let data = await Dashboard(dateTime, [partner.name], FieldType.STREAM_TYPE, partner.roles);
        //console.log("Dashboard", data);
        res.json(data);
        return;
    } catch (e) {
        if (e.message) {
            res.status(500).send({error: e.message});
            console.log("Error on DashBoard", e)
            res.end();
            return
        }
        res.status(500).send({error: "Could not process"});
    }
})

Partner.all("/realtime", authPartner, async (req, res) => {

    const {list, count} = req.query;
    const {partner} = res.locals;

    try {

        let similarChannels = await processAndResult(dateTime.toMillis(), dateTime.toMillis(), `select channels_type,channels_name from channels where channels_active=1 AND channels_type IN(select channels_type from channels where channels_name="${partner.name}");`)
        console.log("Similar Channels", similarChannels.map(({channels_name}) => channels_name));

        let realtime = await Realtime(dateTime, [partner.name], {
            list: true, count: !!count
        }, FieldType.STREAM_TYPE, partner.roles, similarChannels.map(({channels_name}) => channels_name));
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

Partner.post("/epg", authPartner, async (req, res) => {

    const {partner} = res.locals;
    const {time} = req.body;

    if (!time) {
        res.status(404).json({error: "Time is required."}).end();
        return;
    }

    let dateTime = DateTime.fromMillis(parseInt(time));
    let dateSql = dateTime.toSQL();

    console.log(dateSql);

    let sql = `SELECT epg_events_title AS title,epg_events_subtitle as subTitle FROM epg_events
                WHERE epg_events_channels_id = ${partner.mwId} AND epg_events_start < '${dateSql}' AND epg_events_end > '${dateSql}'`;

    let epg = await processAndResult(dateTime.toMillis(), dateTime.toMillis(), sql);

    res.json(epg);

})

Partner.post("/funnel", authPartner, (async (req, res) => {

    const {partner} = res.locals;

    try {
        const schema = Joi.object({
            from: Joi.number().required().label("Start Date"),
            to: Joi.number().label("End Date"),
            type: Joi.allow("", null).label("Query type"),
            interval: Joi.allow("", null).label("Interval"),
        });

        //TODO GET POST
        let {from, to, type, interval, tamper} = await schema.validateAsync(req.body);

        let fromDateTime = DateTime.fromMillis(parseInt(from));
        let toDateTime = DateTime.fromMillis(parseInt(to));

        let duration = toDateTime.diff(fromDateTime).toObject() || {};
        const durationObject = getDurationObject(parseInt(String(duration.milliseconds || 0)));

        console.log("Duration", durationObject);

        let {
            thtPeriodInterval,
            thtPeriod, days, hours
        } = await Funnel(interval, durationObject, [partner.name], type, fromDateTime, toDateTime);

        console.log(fromDateTime.toSQL(), toDateTime.toSQL(), dateTime.toSQL(), duration, partner);
        res.json({
            data: thtPeriod,
            meta: {
                interval: thtPeriodInterval,
                ...duration,
                days,
                hours
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

export default Partner;
