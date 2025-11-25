import { H3, serve } from "h3";
import { readJson, type Inventory } from "./data";
import { installRoutes } from "./routes";
import { installUi } from "./ui";

export const appData: {
  jwtSecret: string;
  validSessions: string[];
  db: Inventory[];
} = {
  jwtSecret: "very-super-secret-string",
  validSessions: [],
  db: [],
};

async function main() {
  appData.db = await readJson("src/switch_inventory.json");

  const app = new H3();

  installRoutes(app);
  installUi(app);

  serve(app, { port: 3000 });
}

main();
