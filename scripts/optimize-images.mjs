// Optional authoring tool: install cwebp to regenerate these committed assets.
// No image tool or build step is needed when serving the site.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const images = fileURLToPath(new URL('../images/', import.meta.url));
const output = join(images, 'optimized');
mkdirSync(output, { recursive: true });

const assets = [
  ['Logo.png', 'church-logo', [150], 90],
  ['2026 Theme.png', 'theme-2026', [480, 900], 85],
  ['Easter2025.png', 'easter-2025', [480, 900], 85],
  ['PWN e-card.jpg', 'prayer-warriors', [480, 960], 85],
  ['Easter Convention.jpg', 'easter-2024', [480, 900], 85],
  ['Women Conference Flyer Template - Made with PosterMyWall.jpg', 'women-conference', [360, 707], 85],
  ['Shilohfestival.jpeg', 'shiloh-festival', [480, 960], 85],
  ['Radio Vuna Logo.png', 'radio-vuna', [263], 85],
  ['PastorsImg1-removebg-preview.png', 'senior-pastors', [577], 85],
  ['Evangelism.jpg', 'evangelism', [480, 960], 82],
];

for (const [source, name, widths, quality] of assets) {
  for (const width of widths) {
    const target = join(output, `${name}-${width}.webp`);
    execFileSync('cwebp', ['-quiet', '-q', String(quality), '-m', '6', '-resize', String(width), '0', join(images, source), '-o', target]);
    console.log(`${name}-${width}.webp: ${statSync(target).size} bytes`);
  }
}
