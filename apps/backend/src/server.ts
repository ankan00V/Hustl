import http from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { initSocket } from "./realtime/socket.js";

const app = createApp();
const server = http.createServer(app);

initSocket(server);

server.listen(env.PORT, () => {
  console.log(`HUSTL API listening on :${env.PORT}`);
});
