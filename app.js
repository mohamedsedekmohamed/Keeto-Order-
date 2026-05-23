import { createServer } from "http";
import next from "next";

const port = process.env.PORT || 3000;
const host = "0.0.0.0";
const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  }).listen(port, host, () => {
    console.log(`Next.js running at http://${host}:${port}`);
  });
});
