import {cache, get} from "../../helpers/cache/cache";
import {enumAllValues, otherConstData, processBucket, processData} from "../datasource";
import {DeviceType, FieldType, Interval, StreamType, Type, Vendor} from "../datasource/datasource-utils";
import {DateTime} from "luxon";

export const Dashboard = async (dateTime: DateTime, channels: Array<string>, fieldType = FieldType.STREAM_TYPE, roles ?: any) => {

    let duration = dateTime.diff(dateTime.endOf("day"), ["seconds"]);
    const secondsToExpire = Math.round(Math.abs(duration['seconds']));
    console.log("About to Expire", secondsToExpire);

    //yesterday
    let yesterdayDateTime = dateTime.minus({days: 1});
    let yesterdayPayload = otherConstData(
        channels,
        enumAllValues(Vendor),
        enumAllValues(DeviceType),
        enumAllValues(Type),
        enumAllValues(StreamType, (roles && !roles.dataAccurancy) ? StreamType.VOD : ""),
        (yesterdayDateTime.startOf("day").toMillis()).toString(),
        (yesterdayDateTime.endOf("day").toMillis()).toString(),
        Interval.MINUTE_15,
        fieldType,
        true,
        true,
        FieldType.TIMESTAMP,
        FieldType.DEVICE_ID
    );

    // console.log(JSON.stringify(yesterdayPayload));
    //last week
    let lastWeekDateTime = dateTime.minus({weeks: 1});
    console.log("Last Week", lastWeekDateTime.toSQL());

    let lastWeekPayload = otherConstData(
        channels,
        enumAllValues(Vendor),
        enumAllValues(DeviceType),
        enumAllValues(Type),
        enumAllValues(StreamType, (roles && !roles.dataAccurancy) ? StreamType.VOD : ""),
        lastWeekDateTime.startOf("week").toMillis().toString(),
        lastWeekDateTime.endOf("week").toMillis().toString(),
        "1d",
        fieldType,
        true,
        true,
        FieldType.TIMESTAMP,
        FieldType.DEVICE_ID
    );


    //console.log("Yesterday", JSON.stringify(yesterdayPayload));
    //console.log("Last Week", JSON.stringify(lastWeekPayload));

    let dataSourceYesterdayKey = `KEY_DATASOURCE_YESTERDAY_${dateTime.year}_${dateTime.month}_${dateTime.day}_${channels.sort().join("_")}`;
    let dataSourceYesterday: any = get(dataSourceYesterdayKey);
    if (!dataSourceYesterday) {
        let dataSourceVar = await processData(yesterdayPayload);
        ///console.log("Before Process",dataSourceVar)
        dataSourceYesterday = dataSourceVar ? dataSourceVar.map((d: any) => processBucket(d)) : [];
        cache(dataSourceYesterdayKey, dataSourceYesterday, secondsToExpire).then(r => console.log(`${dataSourceYesterdayKey} cached`));
    }

    let dataSourceLastWeekKey = `KEY_DATASOURCE_LAST_WEEK_${dateTime.year}_${dateTime.month}_${dateTime.day}_${channels.sort().join("_")}`;
    let dataSourceLastWeek: any = get(dataSourceLastWeekKey);
    if (!dataSourceLastWeek) {
        let dataSourceVar = await processData(lastWeekPayload);
        dataSourceLastWeek = dataSourceVar ? dataSourceVar.map((d: any) => processBucket(d)) : [];
        cache(dataSourceLastWeekKey, dataSourceLastWeek, secondsToExpire).then(r => console.log(`${dataSourceLastWeekKey} cached`));
    }

    return {dataSourceYesterday, dataSourceLastWeek}
}