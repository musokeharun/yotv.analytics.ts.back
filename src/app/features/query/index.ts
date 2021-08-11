import {Router} from "express";
import {DateTime} from "luxon";
import config from "config";
import Http, {isAxiosErrorRes} from "../../utils/http";
import _ from "lodash";

const Query = Router();
const {url} = config.get("Query");

const refId: string = "A";
const bodyProcessor = <JSON>(from: number, to: number, sql: string) => JSON.stringify(
    {
        "from": from.toString(),
        "to": to.toString(),
        "queries": [{
            "refId": refId,
            "intervalMs": 60000,
            "maxDataPoints": 5000,
            "datasourceId": 1,
            "rawSql": sql,
            "format": "table"
        }]
    }
);

export const processStructure = (data: any): Array<any> => {

    let tables;

    if (Array.isArray(data) && data[0] && (<object>data[0]).hasOwnProperty("columns") && (<object>data[0]).hasOwnProperty("rows")) {
        tables = data[0];
    } else if (data && (<object>data).hasOwnProperty("results")) {
        tables = processToTables(data)[0];
    } else {
        return [];
    }

    let headers = tables['columns'].map(({text}: { text: string }) => text);
    return tables['rows'].map((row: any[]) => _.zipObject(headers, row))
}

const processToTables = <any>(({results}: { results: any }) => {
    if (!results || !results[refId])
        return results;
    return results[refId]['tables'];
})

export const processSql = (from: number, to: number, sql: string) => Http(url, bodyProcessor(from, to, sql));

export const processAndResult = async (from: number, to: number, sql: string) => {
    let {data} = await processSql(from, to, sql);
    return processStructure(data);
}

Query.post("/", (async (req, res) => {
    let todayStart = DateTime.now().startOf("day").toMillis();
    let todayEnd = DateTime.now().startOf("hour").toMillis();

    const {sql} = req.body;
    if (!sql || sql.toLowerCase().trim().startsWith("insert") || sql.toLowerCase().trim().startsWith("delete") || sql.toLowerCase().trim().startsWith("update")) {
        res.send({sql: "Could not process sql"});
        res.end();
        return;
    }

    try {
        let {data} = await processSql(todayStart, todayEnd, sql);
        res.json(processStructure(data));
    } catch (e) {
        if (e.isAxiosError) {
            isAxiosErrorRes(e, res, true);
            return;
        }
        res.status(403).send("Could not process");
        return;
    }
}))

export default Query;
