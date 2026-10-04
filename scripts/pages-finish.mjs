import { copyFileSync, writeFileSync } from "node:fs";

copyFileSync("dist-pages/pages.html", "dist-pages/index.html");
copyFileSync("dist-pages/pages.html", "dist-pages/404.html");
writeFileSync("dist-pages/.nojekyll", "");
