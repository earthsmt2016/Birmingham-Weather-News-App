import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostingDir = path.join(rootDir, ".amplify-hosting");
const staticDir = path.join(hostingDir, "static");
const computeDir = path.join(hostingDir, "compute", "default");

const frontendDistDir = path.join(rootDir, "apps", "web", "dist", "public");
const backendDistDir = path.join(rootDir, "apps", "api", "dist");

const manifest = {
  version: 1,
  framework: {
    name: "vite-express",
    version: "1.0.0",
  },
  routes: [
    {
      path: "/api/*",
      target: {
        kind: "Compute",
        src: "default",
      },
    },
    {
      path: "/*.*",
      target: {
        kind: "Static",
        cacheControl: "public, max-age=31536000, immutable",
      },
      fallback: {
        kind: "Compute",
        src: "default",
      },
    },
    {
      path: "/*",
      target: {
        kind: "Compute",
        src: "default",
      },
    },
  ],
  computeResources: [
    {
      name: "default",
      runtime: "nodejs22.x",
      entrypoint: "amplify-server.mjs",
    },
  ],
};

const entrypoint = `import { fileURLToPath } from "node:url";

process.env.NODE_ENV ??= "production";
process.env.PORT ??= "3000";
process.env.HOST ??= "0.0.0.0";
process.env.STATIC_ASSETS_DIR = fileURLToPath(new URL("./public/", import.meta.url));

await import("./index.mjs");
`;

await rm(hostingDir, { recursive: true, force: true });
await mkdir(staticDir, { recursive: true });
await mkdir(computeDir, { recursive: true });

await cp(frontendDistDir, staticDir, { recursive: true });
await cp(frontendDistDir, path.join(computeDir, "public"), { recursive: true });
await cp(backendDistDir, computeDir, { recursive: true });

await writeFile(path.join(computeDir, "amplify-server.mjs"), entrypoint);
await writeFile(path.join(hostingDir, "deploy-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log("Prepared Amplify Hosting bundle at .amplify-hosting");
