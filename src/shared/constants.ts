// Put shared constants here

export const paramMissingError = 'One or more of the required parameters was missing.';

export enum MILLISECONDS {
    YEAR = 31536000000,
    QUARTER = 7862400000,
    MONTH = 2592000000,
    WEEK = 604800000,
    DAY = 86400000,
    HOUR = 3600000,
    MINUTE = 60000,
    SECOND = 1000

}

export const getDurationObject = (milliseconds: number) => {
    return {
        years: Math.round(milliseconds / MILLISECONDS.YEAR),
        quarters: Math.round(milliseconds / MILLISECONDS.QUARTER),
        months: Math.round(milliseconds / MILLISECONDS.MONTH),
        weeks: Math.round(milliseconds / MILLISECONDS.WEEK),
        days: Math.round(milliseconds / MILLISECONDS.DAY),
        hours: Math.round(milliseconds / MILLISECONDS.HOUR),
        minutes: Math.round(milliseconds / MILLISECONDS.MINUTE),
        seconds: Math.round(milliseconds / MILLISECONDS.SECOND),
    }
}

// Strings
export const loginFailedErr = 'Login failed';

// Numbers
export const pwdSaltRounds = 12;

// Cookie Properties
export const cookieProps = Object.freeze({
    key: 'YoTvChannels',
    secret: process.env.COOKIE_SECRET,
    options: {
        httpOnly: true,
        signed: true,
        path: (process.env.COOKIE_PATH),
        maxAge: Number(process.env.COOKIE_EXP || 86400),
        domain: (process.env.COOKIE_DOMAIN),
        secure: (process.env.SECURE_COOKIE === 'true'),
    },
});
