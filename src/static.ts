import { serveStatic, type H3 } from "h3";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export function installStatic(app: H3) {
  const uiPath = join("build", "docs");
  const staticPath = "public";

  app.use("/docs/**", async (event) => {
    return serveStatic(event, {
      indexNames: ["/index.html"],
      getContents: (id) => {
        return readFile(join(uiPath, id.slice(5)));
      },
      getMeta: async (id) => {
        const stats = await stat(join(uiPath, id.slice(5))).catch(() => {});
        if (stats?.isFile()) {
          return {
            size: stats.size,
            mtime: stats.mtimeMs,
          };
        }
      },
    });
  });

  app.use("/**", async (event) => {
    return serveStatic(event, {
      indexNames: ["/index.html"],
      getContents: (id) => {
        return readFile(join(staticPath, id));
      },
      getMeta: async (id) => {
        const stats = await stat(join(staticPath, id)).catch(() => {});
        if (stats?.isFile()) {
          return {
            size: stats.size,
            mtime: stats.mtimeMs,
          };
        }
      },
    });
  });
}
