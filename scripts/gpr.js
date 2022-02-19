import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const pkg = JSON.parse(await fs.promises.readFile('package.json'));

pkg.name = `@dexare/${pkg.name}`;

fs.writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '../package.json'), JSON.stringify(pkg));
