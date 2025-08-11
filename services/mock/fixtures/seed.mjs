import fs from 'fs';
import path from 'path';

const root = process.cwd();
const srcFeeds = path.join(root, 'services', 'mock', 'fixtures', 'feeds.json');
const dstFeeds = path.join(root, 'services', 'feeds', 'feeds.json');

fs.mkdirSync(path.dirname(dstFeeds), { recursive: true });
fs.copyFileSync(srcFeeds, dstFeeds);
console.log('Seeded feeds to', dstFeeds);


