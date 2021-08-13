import './pre-start';
import app from "./Server";
import logger from "./shared/Logger"; // Must be the first import


// Start the server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    logger.info('Express server started on port: ' + port);
});
