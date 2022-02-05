import {Router} from "express";
import {DateTime} from "luxon";
import {processSql, processSqlStructure, processStructure} from "../query";
import {isAxiosErrorRes} from "../../utils/http";
import {getGreetingTime} from "../../utils/utils";
import config from "config";

const Vod = Router();

Vod.all("/", (req, res) => {
    res.send("Reached")
});

Vod.post("/sql", async (req, res) => {
    const {sql} = req.body;
    if (!sql) {
        res.status(400).send("No sql.");
        return;
    }
    try {
        const {data} = await processSql(new Date().getTime(), new Date().getTime(), sql);
        return res.json(data);
    } catch (e) {
        if (e.isAxiosError)
            return res.status(400).json(e.response.data);
        return res.status(400).send("Error");
    }
})

Vod.post("/report", async (req, res) => {

    const {from, to, relative} = req.body;
    const {zone} = config.get("Time");
    // TODO CHANGE ZONE TO CURRENT

    if (!from || !to) {
        res.status(404).send({error: "Parameters not specified"});
        res.end();
        return;
    }
    let duration = {"hours": 3};
    const startDate = DateTime.fromMillis(Number.parseInt(from), {zone}).startOf("day").minus(duration);
    const start = startDate.toMillis();
    const endDate = DateTime.fromMillis(Number.parseInt(to), {zone}).endOf("day").minus(duration);
    const end = endDate.toMillis();

    console.log(startDate.toSQL(), endDate.toSQL(), startDate.zoneName, startDate.toMillis(), endDate.toMillis());
    // let sql = `select vods_id as __value, vods_name as __text from vods`;

    const sql = `SELECT 
                customers_login as 'Login',
                profiles_name as 'Profile',
                vods_name as 'VOD',
                continue_watching_vods_updated as 'lastSeen',
                genres_name as 'genre',
                categories_name as "category",
                continue_watching_vods_updated as "date",
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
        const {data} = await processSql(start, end, sql);
        const structure = processSqlStructure(data);
        const structureWithDate = structure.map((value) => {
            const lastSeen = DateTime.fromMillis(value['lastSeen'], {zone})
            value['hour'] = lastSeen.hour;
            value['timeOfDay'] = getGreetingTime(lastSeen.hour)
            value['day'] = lastSeen.toFormat("ccc")
            return value;
        })
        res.send(structureWithDate)
        res.end();
    } catch (error) {
        // return res.end();
        // timeout will also raise an error since there is no "cancel" handler
        if (error.isAxiosError) {
            isAxiosErrorRes(error, res)
            console.log("Error", JSON.stringify(error.response.data));
            return
        }
        res.status(403).send("Could not process");
        res.end()
    }
});

export default Vod;
