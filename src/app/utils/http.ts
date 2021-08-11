import axios, {AxiosError, Method} from "axios";
import headers from "./header";
import {Response} from "express";

const Http = (url: string, data: any, method: Method = "POST") => (
    axios.request<any>({
        url,
        headers,
        method,
        data
    })
);

export function isAxiosErrorRes(e: Error, res?: Response, respond?: boolean): AxiosError {
    let m = (<AxiosError>e).message;
    console.log((<AxiosError>e).message);
    if (res && respond) {
        res.status(500).send({"message": m});
        res.end()
    }
    return (<AxiosError>e);
}


export default Http;