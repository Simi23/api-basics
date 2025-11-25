import { serveStatic, type H3 } from "h3";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import swaggerUiDist from "swagger-ui-dist";

export function installUi(app: H3) {
  const uiPath = swaggerUiDist.getAbsoluteFSPath();
  console.log(uiPath);

  app.use("/docs/**", async (event) => {
    return serveStatic(event, {
      indexNames: ["/index.html"],
      getContents: (id) => {
        return readFile(join(uiPath, id.slice(5)));
      },
      getMeta: async (id) => {
        const stats = await stat(join(uiPath, id.slice(5))).catch(() => {});
        if (stats?.isFile()) {
          console.log("File found");
          return {
            size: stats.size,
            mtime: stats.mtimeMs,
          };
        }
      },
    });
  });
}
