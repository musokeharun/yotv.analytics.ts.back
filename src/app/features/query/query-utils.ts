import {processAndResult} from "./index";
import {DateTime} from "luxon";
import {cache, get} from "../../helpers/cache/cache";

export async function getChannelIds(dateTime: DateTime, channels: Array<string>, sqlFormat = true): Promise<any> {
    let channelString = `"${channels.join(`","`)}"`;
    console.log(channelString);
    let key = `KEY_CHANNELS_ID_${channels.sort().join("_")}`;
    let channelsIdCache = get(key);
    let where = "";
    if (channels.length === 1) {
        where = `='${channels[0]}'`;
    } else {
        where = `IN(${channelString})`;
    }
    if (!channelsIdCache) {
        let channelsId = await processAndResult(dateTime.toMillis(), dateTime.toMillis(), `SELECT channels_id as id FROM channels WHERE channels_name ${where}`);
        if (!channelsId.length) {
            console.log("No Channels Found")
            return []
        }
        cache(key, channelsIdCache, 0).then(() => console.log(`${key} cached`));
        channelsIdCache = channelsId;
    }
    let idsArray = channelsIdCache.map((value: any) => value.id.toString().trim());
    if (sqlFormat) {
        return `"${idsArray.join('","')}"`.trim();
    }
    return idsArray;
}

export const getEqualOrIn = (array: Array<any>) => array.length === 1 ? `="${array[0]}"` : `IN("${array.join('","')}")`;
