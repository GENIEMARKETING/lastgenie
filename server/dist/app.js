"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
const app = (0, express_1.default)();
exports.app = app;
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "1mb" }));
app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
});
app.use("/api", routes_1.apiRouter);
app.use((_req, res) => {
    res.status(404).json({ ok: false, error: "Not found" });
});
