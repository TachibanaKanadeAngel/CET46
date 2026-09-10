import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outDir = 'miniprogram/assets/icons';

function svgToPng(name, svg) {
  return sharp(Buffer.from(svg))
    .resize(81, 81)
    .png()
    .toFile(path.join(outDir, name));
}

const svgs = {
  'study.png': `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81"><rect x="18" y="22" width="45" height="34" rx="4" fill="none" stroke="#5c4033" stroke-width="5"/><line x1="28" y1="33" x2="53" y2="33" stroke="#5c4033" stroke-width="4" stroke-linecap="round"/><line x1="28" y1="45" x2="48" y2="45" stroke="#5c4033" stroke-width="4" stroke-linecap="round"/></svg>`,
  'study-active.png': `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81"><rect x="18" y="22" width="45" height="34" rx="4" fill="#b16223" stroke="#b16223" stroke-width="5"/><line x1="28" y1="33" x2="53" y2="33" stroke="#fff" stroke-width="4" stroke-linecap="round"/><line x1="28" y1="45" x2="48" y2="45" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`,
  'wrong-active.png': `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81"><circle cx="40.5" cy="40.5" r="22" fill="#c41e3a"/><line x1="31" y1="31" x2="50" y2="50" stroke="#fff" stroke-width="5" stroke-linecap="round"/><line x1="50" y1="31" x2="31" y2="50" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`,
  'stats-active.png': `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81"><rect x="20" y="48" width="10" height="18" rx="2" fill="#2d8a1a"/><rect x="35" y="32" width="10" height="34" rx="2" fill="#2d8a1a"/><rect x="50" y="22" width="10" height="44" rx="2" fill="#2d8a1a"/></svg>`,
  'profile-active.png': `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81"><circle cx="40.5" cy="30" r="12" fill="#b16223"/><path d="M22 62c0-12 10-18 18.5-18s18.5 6 18.5 18" fill="none" stroke="#b16223" stroke-width="5" stroke-linecap="round"/></svg>`
};

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  for (const [name, svg] of Object.entries(svgs)) {
    await svgToPng(name, svg);
    console.log('generated', name);
  }
  console.log('all tabBar icons generated');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
