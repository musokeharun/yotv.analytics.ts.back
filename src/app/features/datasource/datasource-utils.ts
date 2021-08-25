export enum FieldType {
    COUNTRIES = "countriesCode",
    VOD = "vodsName",
    DEVICE_TYPE = "devicesType",
    STREAM_TYPE = "streamType",
    TYPE = "type",
    CHANNELS = "channelsName",
    TIMESTAMP = "@timestamp",
    DEVICE_ID = "devicesId",
    PROFILE_ID = "profilesId"
}

export enum StreamType {
    LIVE = "live",
    TIME_SHIFT = "timeshift",
    CATCH_UP = "catchup",
    VOD = "vod",
    RECORDING = "recording"
}

export enum Type {
    UNICAST = "unicast",
    MULTICAST = "multicast",
    BROADCAST = "broadcast"
}

export enum DeviceType {
    android = "android",
    web = "web player",
    ios = "ios",
    androidTv = "android tv"
}

export enum Vendor {
    Albayan = "Albayan",
    Yotvs = "Yotvs"
}

export enum Interval {
    MINUTE = "1m",
    MINUTE_30 = "30m",
    MINUTE_15 = "15m",
    HOUR = "1h",
    DAY = "1d",
    WEEK = "14d",
    MONTH = "30d",
    YEAR = "360d",
    QUARTER = "90d"
}

export const getType = (type: string) => {

    switch (type) {
        case "cast":
            return FieldType.TYPE;
        case "devices" :
            return FieldType.DEVICE_TYPE;
        case "stream":
            return FieldType.STREAM_TYPE
        case "country" :
            return FieldType.COUNTRIES;
        default:
            return FieldType.CHANNELS;
    }

}