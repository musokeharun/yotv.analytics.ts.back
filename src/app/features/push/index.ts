import {Router} from "express";
import config from "config";
import axios from "axios";

const Push = Router();

Push.all("/", (req, res) => {
    res.send({error: "Not allowed"}).status(403).end();
})

Push.post("/deliver", async (req, res) => {

    const {title, link, image, subTitle, message, contacts} = req.body;
    if (!title || !contacts) {
        res.send({error: "Title and Contacts are required."}).status(404).end();
        return;
    }

    try {
        let {data} = await axios.post(config.get("Push.url"), {title, link, image, subTitle, message, contacts});
        res.send({msg: data});
        return;

    } catch (e) {
        console.log(e);
        res.send({error: e.message || e.response.data || "Couldn't process"}).status(500);
        return;
    }
})

export default Push;