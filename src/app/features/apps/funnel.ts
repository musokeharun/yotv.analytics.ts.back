import {FieldType, getType, Interval, StreamType} from "../datasource/datasource-utils";
import {DateTime} from "luxon";
import {getDataSource} from "../admin";

const Funnel = async (interval: Interval, days: number | undefined, hours: number | undefined, channelsArray: Array<any>, type: StreamType, fromDateTime: DateTime, toDateTime: DateTime, roles ?: any) => {
    let thtPeriodInterval = Interval.MINUTE_30;
    if (interval) {
        thtPeriodInterval = interval;
    } else if (days && days > 90) {
        thtPeriodInterval = Interval.MONTH
    } else if (days && days > 6) {
        thtPeriodInterval = Interval.DAY;
    } else if (days && days > 3) {
        thtPeriodInterval = Interval.HOUR
    } else if (days && days <= 1 && hours && hours < 48) {
        thtPeriodInterval = Interval.MINUTE;
    } else if (days && days > 1 && days < 4) {
        thtPeriodInterval = Interval.MINUTE_15;
    }

    let fieldType = channelsArray.length > 1 ? FieldType.CHANNELS : getType(type || "");
    let thtPeriod = await getDataSource(channelsArray, fromDateTime, toDateTime, thtPeriodInterval, fieldType, FieldType.DEVICE_ID, roles);
    return {thtPeriodInterval, thtPeriod};
}

export default Funnel