"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTANT: Import config/env FIRST to ensure environment variables are loaded
// before any services are instantiated
require("./config/env");
const env_1 = require("./config/env");
const app_1 = require("./app");
// Verify environment variables are loaded (for debugging)
(0, env_1.verifyEnvLoaded)();
const port = Number(process.env.PORT ?? 3001);
app_1.app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`lastgenie server running on port ${port}`);
});
