import {Router} from "express";
import config from "config";
import {DeviceType, FieldType, Interval, StreamType, Type, Vendor} from "./datasource-utils";
import {DateTime} from "luxon";
import Http, {isAxiosErrorRes} from "../../utils/http";

const Datasource = Router();
const aggIndex = 3;
const nextAgg = aggIndex - 1;
const lastAgg = nextAgg - 1

export function enumAllValues(_enum: any, exclude: any = ""): Array<string> {
    let keys = Object.keys(_enum);
    // console.log("keys", keys)
    return keys.map(key => _enum[key]).filter(s => s !== exclude);
}

const constData = {"search_type": "query_then_fetch", "ignore_unavailable": true, "index": "watching_statistics"};

const createEscapedStringFromArray = (input: Array<string>): string => {
    if (input.length === 1) return `"${input}"`;
    return input.map(item => `"${item}"`).join(" OR ");
}

export const otherConstData = (channel: Array<string>, vendor: Array<string>, deviceTypes: Array<string>, types: Array<string>, streamTypes: Array<string>, from: string, to: string, interval: string, field: string, cardinality: boolean = true, addHistogram: boolean = true, histogramField?: string, cardinalityField?: string, isRealTime = false) => {


    let channels = createEscapedStringFromArray(channel);
    let vendors = createEscapedStringFromArray(vendor);
    let devices = createEscapedStringFromArray(deviceTypes);
    let castTypes = createEscapedStringFromArray(types);
    let streams = createEscapedStringFromArray(streamTypes);
    let size = Math.round(Math.random() * 100);

    if (isRealTime) return getRealTimeConfig(from, to, vendors);

    const cardinalitySection = cardinality ? {[lastAgg]: {"cardinality": {"field": cardinalityField}}} : {};
    const histogram = addHistogram ? {
        [nextAgg]: {
            "date_histogram": {
                "interval": interval,
                "field": histogramField,
                "min_doc_count": 0,
                "extended_bounds": {"min": from, "max": to},
                "format": "epoch_millis"
            }, "aggs": {...cardinalitySection}
        }
    } : {};

    return {
        "size": 0,
        "query": {
            "bool": {
                "filter": [
                    {
                        "range": {
                            "@timestamp": {
                                "gte": from,
                                "lte": to,
                                "format": "epoch_millis"
                            }
                        }
                    },
                    {
                        "query_string": {
                            "analyze_wildcard": true,
                            "query": `vendorsName:(${vendors}) AND devicesType:(${devices}) AND type:(${castTypes}) AND streamType:(${streams}) AND isRenewal:true AND (channelsName:${channels} OR (NOT _exists_: channelsName))`
                        }
                    }]
            }
        },
        "aggs": {
            [aggIndex]: {
                "terms": {
                    "field": `${field}`,
                    "size": size,
                    "order": {"_key": "desc"},
                    "min_doc_count": 1
                },
                "aggs": {...histogram}
            }
        }
    }
}

const getRealTimeConfig = (to: string, from: string, vendors: string) => {
    return {
        "aggs": {
            [aggIndex]: {
                "aggs": {
                    [nextAgg]: {
                        "cardinality": {
                            "field": FieldType.DEVICE_ID
                        }
                    }
                },
                "date_histogram": {
                    "extended_bounds": {
                        "max": from,
                        "min": to
                    },
                    "field": FieldType.TIMESTAMP,
                    "format": "epoch_millis",
                    "interval": Interval.MINUTE,
                    "min_doc_count": 0
                }
            }
        },
        "query": {
            "bool": {
                "filter": [
                    {
                        "range": {
                            "@timestamp": {
                                "format": "epoch_millis",
                                "gte": to,
                                "lte": from
                            }
                        }
                    },
                    {
                        "query_string": {
                            "analyze_wildcard": true,
                            "query": `vendorsName:(${vendors})`
                        }
                    }
                ]
            }
        },
        "size": 0
    }
}

export const processData = async (otherConstData: object) => {
    const {url} = config.get("DataSource");

    let body = JSON.stringify(constData) + "\n" + JSON.stringify(otherConstData) + "\n";
    //console.log("dataSource", body);

    try {
        let {data} = await Http(url, body);
        let took = data['took'];
        let responses = data['responses'];
        if (!responses || !responses.length) return [];
        let aggs = responses[0]['aggregations'];
        if (!aggs || aggs.length) return [];
        let buckets = aggs[aggIndex.toString()]['buckets'];
        return buckets;
        // return buckets[0][lastAgg.toString()]['buckets'];
    } catch (e) {
        if (e.isAxiosError) {
            let {message, code} = isAxiosErrorRes(e);
            console.log(code, message)
            throw new Error(message);
        } else {
            console.log(e);
            throw e;
        }
    }
}

export const processBucket = (bucket: any) => {
    return {
        key: bucket['key'],
        values: bucket[nextAgg]['buckets'].map((b: any) => {
            return {
                value: b[lastAgg]['value'],
                key: b['key'],
                docs: b['doc_count']
            }
        }),
        docs: bucket['doc_count']
    }
}

Datasource.all("/", async (req, res) => {

    let to = DateTime.now().toMillis().toString();
    let from = DateTime.now().minus({weeks: 2}).toMillis().toString();

    let data = otherConstData(
        ["NTV"],
        [Vendor.Albayan, Vendor.Yotvs],
        [DeviceType.android, DeviceType.androidTv, DeviceType.ios, DeviceType.web],
        [Type.BROADCAST, Type.MULTICAST, Type.UNICAST],
        [StreamType.LIVE, StreamType.VOD, StreamType.CATCH_UP, StreamType.RECORDING, StreamType.TIME_SHIFT],
        from, to,
        Interval.DAY,
        FieldType.CHANNELS,
        true,
        true,
        FieldType.TIMESTAMP,
        FieldType.DEVICE_TYPE
    );

    try {
        let response = await processData(data);
        res.json(response)
    } catch (e) {
        if (e.message) {
            res.status(500).send(e);
            res.end();
            return
        }
        res.status(500).send("Could not process");
    }
})

export default Datasource;