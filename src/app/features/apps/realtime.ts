import {DateTime} from "luxon";
import {get} from "../../helpers/cache/cache";
import {processAndResult} from "../query";
import {enumAllValues, otherConstData, processBucket, processData} from "../datasource";
import {DeviceType, FieldType, Interval, StreamType, Type, Vendor} from "../datasource/datasource-utils";
import {getChannelIds, getEqualOrIn} from "../query/query-utils";
import CacheService from "../../helpers/cache/service";
import config from "config";

const ttl = 60 * 5;
const cache = new CacheService(ttl);
const {zone} = config.get("Time");

export const Realtime = async (dateTime: DateTime, channels: Array<string>, params: any, fieldType = FieldType.STREAM_TYPE, roles?: any, otherChannels: string[] = []): Promise<any | Error> => {
    const {list, count} = params;

    let time = DateTime.now();
    let now = time.setZone(zone).toMillis();
    let earlier = time.minus({minutes: 30}).toMillis();
    console.log("Current Date",new Date(now).toLocaleString());
    console.log(new Date().toLocaleString());

    let epg: any = {};
    let ids = await getChannelIds(dateTime, channels, false);
    // console.log("Ids", ids, channels);

    // CURRENT EPG
    /////////////
    let epgCurrentKey = `KEY_EPG_CURRENT_${dateTime.year}_${dateTime.month}_${dateTime.day}_${channels.sort().join("_")}`;
    let storeFunction = processAndResult(now, earlier, `select epg_events_id AS id,epg_events_start as start,epg_events_end as end,epg_events_title as title,epg_events_duration as duration from epg_events where epg_events_channels_id ${getEqualOrIn(ids)} AND epg_events_start  < now() and epg_events_end > now();`);
    let epgCurrent: any = await cache.get(epgCurrentKey, storeFunction);
    epg['current'] = epgCurrent;

    let eventClause = "=0";
    if (epgCurrent.length) {
        let ids = epgCurrent.map((e: any) => e['id']);
        eventClause = getEqualOrIn(ids);
    }

    // CUSTOMER REACH ON CURRENT EPG
    if (list) {
        let epgListKey = `REALTIME_EPG_LIST_${dateTime.year}_${dateTime.month}_${dateTime.day}_${channels.sort().join("_")}`;
        let storeFunction1 = processAndResult(now, earlier, `select continue_watching_events_updated as updated ,continue_watching_events_second as lastSecond,continue_watching_events_finished as isFinished from continue_watching_events where continue_watching_events_epg_events_id ${eventClause} order by continue_watching_events_updated desc limit 10;`);
        epg['list'] = await cache.get(epgListKey, storeFunction1)
    }

    // CUSTOMER REACH COUNT
    if (count) {
        let epgCountKey = `KEY_EPG_COUNT_${dateTime.year}_${dateTime.month}_${dateTime.day}_${channels.sort().join("_")}`;
        let promise = processAndResult(now, earlier, `select count(*) as total from continue_watching_events where continue_watching_events_epg_events_id ${eventClause};`);
        let epgCountVar: any = await cache.get(epgCountKey, promise);
        epg['count'] = epgCountVar[0] ? epgCountVar[0]['total'] : 0;
    }

    //last 10 mins category streamTypes
    let payload = otherConstData(
        channels,
        enumAllValues(Vendor),
        enumAllValues(DeviceType),
        enumAllValues(Type),
        enumAllValues(StreamType, (roles && !roles.dataAccurancy) ? StreamType.VOD : ""),
        earlier.toString(),
        now.toString(),
        "1m",
        fieldType,
        true,
        true,
        FieldType.TIMESTAMP,
        FieldType.PROFILE_ID,
    );

    let channelsPayload = otherConstData(otherChannels,
        enumAllValues(Vendor),
        enumAllValues(DeviceType),
        enumAllValues(Type),
        enumAllValues(StreamType),
        earlier.toString(),
        now.toString(),
        Interval.DAY,
        FieldType.CHANNELS,
        true,
        true,
        FieldType.TIMESTAMP,
        FieldType.DEVICE_ID,
    );
    // console.log(JSON.stringify(channelsPayload));
    // @ts-ignore
    let query = channelsPayload.query.bool.filter[1]['query_string'].query;
    let queries = query.split(" AND ");
    // @ts-ignore
    channelsPayload.query.bool.filter[1]['query_string'].query = queries[0]
    //console.log("Channel Payload", queries[0]);


    // let channelsDataSourceKey = `KEY_CHANNEL_LIST_DATASOURCE_${dateTime.year}_${dateTime.month}_${dateTime.day}_${channels.sort().join("_")}`;
    let channelStatsVar: any = await processData(channelsPayload); // cache.get(channelsDataSourceKey, processData(channelsPayload));
    let channelStats = [];
    if (channelStatsVar) {
        channelStats = channelStatsVar.map((data: any) => processBucket(data))
        if (otherChannels.length) {
            channelStats = channelStats.filter((dataSource: any) => otherChannels.includes(dataSource.key))
        }
    }

    // let realTimeDataSourceKey = `KEY_REAL_TIME_DATASOURCE_${dateTime.year}_${dateTime.month}_${dateTime.day}_${channels.sort().join("_")}`;
    let dataSourcesVar: any = await processData(payload); // cache.get(realTimeDataSourceKey, processData(payload));
    let dataSources: any[] = [];
    if (dataSourcesVar) {
        // console.log("Real Time DataSource", dataSourcesVar);
        dataSources = dataSourcesVar.map((data: any) => processBucket(data))
    }

    // console.log("DataSources", dataSources)
    return {dataSources, epg, channelStats};
}