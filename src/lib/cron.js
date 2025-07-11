import cron from "cron";
import https from "https";

const job = new cron.CronJob('*/14 * * * *', () => {
    https.get(process.env.API_URL, (res) => {
        if (res.statusCode === 200) {
            console.log("Cron job executed successfully");
        } else {
            console.error(`Cron job failed with status code: ${res.statusCode}`);
        }
    }).on('error', (err) => {
        console.error(`Error executing cron job: ${err.message}`);
    });
})