import swaggerJsdoc from "swagger-jsdoc";
import {
  writeFile,
  copyFile,
  mkdir,
  readdir,
  readFile,
} from "node:fs/promises";
import swaggerUiDist from "swagger-ui-dist";
import path from "node:path";

// Copy swagger UI
await mkdir("./build/docs", { recursive: true });
const files = await readdir(swaggerUiDist.getAbsoluteFSPath());
await Promise.all(
  files.map((f) => {
    const src = path.join(swaggerUiDist.getAbsoluteFSPath(), f);
    const dst = path.join("build", "docs", f);
    return copyFile(src, dst);
  })
);

// Replace swagger json path
// "https://petstore.swagger.io/v2/swagger.json"
const initializer = path.join("build", "docs", "swagger-initializer.js");
let configContent = (await readFile(initializer, "utf8")).replace(
  "https://petstore.swagger.io/v2/swagger.json",
  "/docs/swagger.json"
);
await writeFile(initializer, configContent);

// Create swagger doc
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Interface státusz API",
      version: "1.0.0",
      description:
        "API dokumentáció hálózati eszközök interfészeinek állapotáról",
    },
  },
  apis: ["./src/*.ts"],
};

const spec = swaggerJsdoc(options);

await writeFile("./build/docs/swagger.json", JSON.stringify(spec, null, 2));

// Create server bundle
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./build",
  target: "bun",
});
