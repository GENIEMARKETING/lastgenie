// IMPORTANT: Import config/env FIRST to ensure environment variables are loaded
// before any services are instantiated
import "./config/env";
import { verifyEnvLoaded } from "./config/env";

import { app } from "./app";

// Verify environment variables are loaded (for debugging)
verifyEnvLoaded();

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`lastgenie server running on port ${port}`);
});
