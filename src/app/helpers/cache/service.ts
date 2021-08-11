import NodeCache from 'node-cache';

class CacheService {
    private cache: NodeCache;

    constructor(ttlSeconds: number) {
        this.cache = new NodeCache({stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false});
    }

    get(key: string, storeFunction: Promise<any>) {
        const value = this.cache.get(key);
        if (value) {
            console.log(key + " is found")
            return Promise.resolve(value);
        }

        console.log(key + " not found")
        return storeFunction.then((result) => {
            this.cache.set(key, result);
            return result;
        });
    }

    del(keys: any) {
        this.cache.del(keys);
    }

    delStartWith(startStr = '') {
        if (!startStr) {
            return;
        }

        const keys = this.cache.keys();
        for (const key of keys) {
            if (key.indexOf(startStr) === 0) {
                this.del(key);
            }
        }
    }

    flush() {
        this.cache.flushAll();
    }
}


export default CacheService;
