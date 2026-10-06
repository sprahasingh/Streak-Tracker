import "dotenv/config";
import { createApp } from "./app.js";
import { connectToDatabase, disconnectFromDatabase } from "./config/database.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

await connectToDatabase();
const server = app.listen(port, () => console.info(`API listening on port ${port}`));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => {
      void disconnectFromDatabase().finally(() => process.exit(0));
    });
  });
}
