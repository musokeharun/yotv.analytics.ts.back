import {FieldType, getType, Interval, StreamType} from "../datasource/datasource-utils";
import {DateTime} from "luxon";
import {getDataSource} from "../admin";
import logger from "../../../shared/Logger";

const returnInterval = (value: number, interval: Interval, expected: number) => {
    if (value && value >= expected) {
        return interval;
    }
    return false;
}

const Funnel = async (interval: Interval, durationObject: any, channelsArray: Array<any>, type: StreamType, fromDateTime: DateTime, toDateTime: DateTime, roles ?: any) => {

    const {years, months, days, quarters, weeks, hours, minutes, seconds} = durationObject;
    let thtPeriodInterval = returnInterval(years, Interval.YEAR, 6) ||
        returnInterval(quarters, Interval.QUARTER, 6) ||
        returnInterval(months, Interval.MONTH, 6) ||
        returnInterval(weeks, Interval.WEEK, 4) ||
        returnInterval(days, Interval.DAY, 7) ||
        returnInterval(hours, Interval.HOUR, 12) ||
        returnInterval(hours, Interval.HOUR, 6) ||
        returnInterval(hours, Interval.MINUTE_30, 4) ||
        returnInterval(hours, Interval.MINUTE_15, 2) || Interval.MINUTE

    logger.info("Interval" + interval);
    logger.info("Tht Interval" + thtPeriodInterval)
    logger.info("Days" + days)

    let fieldType = channelsArray.length > 1 ? FieldType.CHANNELS : getType(type || "");
    let thtPeriod = await getDataSource(channelsArray, fromDateTime, toDateTime, thtPeriodInterval.toString(), fieldType, FieldType.DEVICE_ID, roles);
    return {thtPeriodInterval, thtPeriod};
}

export default Funnel