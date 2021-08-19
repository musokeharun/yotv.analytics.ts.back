import logger from './Logger';
import {DateTime} from "luxon";
import config from "config";

export const pErr = (err: Error) => {
    if (err) {
        logger.err(err);
    }
};

const {zone} = config.get("Time");
export const getDateTimeNow = DateTime.now().setZone(zone);


export const getRandomInt = () => {
    return Math.floor(Math.random() * 1_000_000_000_000);
};
