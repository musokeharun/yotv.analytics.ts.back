import {response, Router} from "express";
import {DateTime} from "luxon";
// @ts-ignore
import DelayedResponse from "http-delayed-response"
import {processSql, processStructure} from "../query";
import {isAxiosErrorRes} from "../../utils/http";
import {getGreetingTime} from "../../utils/utils";
import config from "config";

const Vod = Router();

Vod.all("/", (req, res) => {
    const delayed = new DelayedResponse(req, res);

    delayed.on('done', function (results: any) {
        // slowFunction responded within 5 seconds
        res.send(results)
        res.end();
    });

    delayed.on('error', function (err: Error) {
        // handle error here
        console.log("Error", err)
        res.end();
        // timeout will also raise an error since there is no "cancel" handler
    });

    delayed.on('abort', function (err: Error) {
        // handle client disconnection
        console.log("Client disconnected")
        res.end();
    });

    ((respond: any) => {
        console.log(respond);
        setTimeout(function () {
            // DelayedResponse.end(null, {id: 1})
            respond(undefined, "Sent Then");
        }, 10000);
        return;
    })(delayed.wait())
});

Vod.post("/report", async (req, res) => {


    let {from, to, relative} = req.body;
    let {zone} = config.get("Time");
    // TODO CHANGE ZONE TO CURRENT

    if (!from || !to) {
        res.status(404).send({error: "Parameters not specified"});
        res.end();
        return;
    }

    const delayed = new DelayedResponse(req, res);

    delayed.on('done', function (results: any) {
        // slowFunction responded within 5 seconds
        res.send(results)
        res.end();
    });

    delayed.on('error', function (err: Error) {
        // handle error here
        console.log("Error", err)
        res.end();
        // timeout will also raise an error since there is no "cancel" handler
    });

    delayed.on('abort', function (err: Error) {
        // handle client disconnection
        console.log("Client disconnected")
        res.end();
    });

    await (async (respond: any) => {

        let startDate = DateTime.fromMillis(Number.parseInt(from), {zone}).startOf("day");
        let start = startDate.toMillis();
        let endDate = DateTime.fromMillis(Number.parseInt(to), {zone}).endOf("day");
        let end = endDate.toMillis();

        console.log(startDate.toSQL(), endDate.toSQL(), startDate.zoneName);

        // let sql = `select vods_id as __value, vods_name as __text from vods`;

        let sql = `SELECT 
                customers_login as 'Login',
                profiles_name as 'Profile',
                vods_name as 'VOD',
                continue_watching_vods_updated as 'lastSeen',
                genres_name as 'genre',
                categories_name as "category",
                case when continue_watching_vods_finished = 1 then 'Yes' else 'No' end as 'Finished'
                from continue_watching_vods
                inner join profiles on profiles_id = continue_watching_vods_profiles_id
                inner join customers on customers_id = profiles_customers_id
                inner join vods on vods_id = continue_watching_vods_vods_id
                inner join categories on vods_categories_id = categories_id
                left join vods_genres on vods_id = vods_genres_vods_id
                left join genres on vods_genres_genres_id = genres_id
                where continue_watching_vods_updated > $__timeFrom() and continue_watching_vods_updated < $__timeTo()`;

        try {
            let {data} = await processSql(start, end, sql);
            let structure = processStructure(data);

            let structureWithDate = structure.map((value) => {
                const lastSeen = DateTime.fromISO(value['lastSeen'], {zone})
                value['hour'] = lastSeen.hour;
                value['timeOfDay'] = getGreetingTime(lastSeen.hour)
                value['day'] = lastSeen.toFormat("ccc")
                return value;
            })

            respond(undefined, structureWithDate);
        } catch (error) {
            if (error.isAxiosError) {
                isAxiosErrorRes(error, res)
            }
            console.log(error)
            res.status(403).send("Could not process");
            res.end()
        }
    })(delayed.wait())
});

export default Vod;
