import express from "express";
import { createServer } from "node:http";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { join } from "node:path";
import { hostname } from "node:os";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";

const __dirname = process.cwd();
const app = express();
const publicPath = join(__dirname, "public");

app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/", express.static(epoxyPath));

const server = createServer();

server.on("request", (req, res) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    app(req, res);
});

server.on("upgrade", (req, socket, head) => {
    wisp.routeRequest(req, socket, head);
});

let port = parseInt(process.env.PORT || "3000");
if (isNaN(port)) port = 3000;

server.on("listening", () => {
    const address = server.address();
    console.log("Listening on:");
    console.log(`\thttp://localhost:${address.port}`);
    console.log(`\thttp://${hostname()}:${address.port}`);
    console.log(
        `\thttp://${address.family === "IPv6" ? `[${address.address}]` : address.address
        }:${address.port}`
    );
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close();
    process.exit(0);
}

server.listen({ port });