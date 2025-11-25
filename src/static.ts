import { serveStatic, type H3 } from "h3";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export function installStatic(app: H3) {
  const staticPath = "public";
  const uiPath = join("build", "docs");

  app.use("/public/**", async (event) => {
    return serveStatic(event, {
      indexNames: ["/index.html"],
      getContents: (id) => {
        return readFile(join(staticPath, id.slice(7)));
      },
      getMeta: async (id) => {
        const stats = await stat(join(staticPath, id.slice(7))).catch(() => {});
        if (stats?.isFile()) {
          return {
            size: stats.size,
            mtime: stats.mtimeMs,
          };
        }
      },
    });
  });

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
}
