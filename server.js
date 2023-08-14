const http = require("http");
const app = require("./app");
var fs = require("fs");
const localtunnel = require("localtunnel");

const port = process.env.PORT || 3001;

const server = http.createServer(app);

var dir = "./temp";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// (async () => {
//   const tunnel = await localtunnel({
//     port: 3001,
//     subdomain: "voxhub",
//   });

//   console.log(`Running at ${tunnel.url}`);
// })();

server.listen(port);
