const http = require("http");
const app = require("./app");
// const localtunnel = require("localtunnel");

const port = process.env.PORT || 3001;

const server = http.createServer(app);

// (async () => {
//   const tunnel = await localtunnel({
//     port: 3001,
//     subdomain: "raaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
//   });

//   console.log(`Running at ${tunnel.url}`);
// })();

server.listen(port);
