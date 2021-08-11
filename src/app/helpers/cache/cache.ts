import NodeCache, {Key, Data} from "node-cache";
import CacheService from "./service";

const appCache = new NodeCache();

export const cache = async (key: NodeCache.Key, data: Data, ttl: number) => {
    let success = appCache.set(key, data, ttl);
    if (!success)
        console.log("Could not cache")
}

export const get = (key: Key): any => {
    const value = appCache.get(key);
    if (value == undefined) {
        console.log(key, "Cache Key Not Found")
    }
    return value;
}

export const stats = appCache.keys();
