import { Router } from 'express';
import auth from 'src/app/auth';
import Partner from 'src/app/features/partner';
import Admin from "../app/features/admin";
import Vod from "../app/features/vod";
import Query from "../app/features/query";
import Push from "../app/features/push";
import Datasource from "../app/features/datasource";


// Export the base-router
const baseRouter = Router();

baseRouter.all("/", (req, res) => {
    res.status(200).json("Welcome to YoTvChannels.Have a nice stay.");
    res.end();
});

// APP CONCENTRATED FUNCTIONALITY
baseRouter.use('/auth', auth)
baseRouter.use("/partner", Partner);
baseRouter.use("/admin", Admin);
baseRouter.use("/query", Query);
baseRouter.use("/vod", Vod);
baseRouter.use("/push", Push);
baseRouter.use("/datasource", Datasource);

export default baseRouter;
