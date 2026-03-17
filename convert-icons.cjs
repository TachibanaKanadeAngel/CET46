const fs = require('fs');
const path = require('path');

// 尝试使用 sharp 进行 SVG 到 PNG 转换
async function convertSVGtoPNG(inputPath, outputPath, size) {
  try {
    const sharp = require('sharp');
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Created: ${outputPath} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath}:`, error.message);
    return false;
  }
}

async function main() {
  const iconsDir = path.join(__dirname, 'icons');

  console.log('🎨 Converting SVG icons to PNG...\n');

  // 定义需要转换的图标
  const conversions = [
    { input: 'icon.svg', output: 'icon-72.png', size: 72 },
    { input: 'icon-192.svg', output: 'icon-192.png', size: 192 },
    { input: 'icon-512.svg', output: 'icon-512.png', size: 512 },
    { input: 'icon-512-maskable.svg', output: 'icon-512-maskable.png', size: 512 }
  ];

  let successCount = 0;

  for (const conv of conversions) {
    const inputPath = path.join(iconsDir, conv.input);
    const outputPath = path.join(iconsDir, conv.output);

    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Input file not found: ${conv.input}`);
      continue;
    }

    // 转换 SVG 到 PNG
    const success = await convertSVGtoPNG(inputPath, outputPath, conv.size);
    if (success) {
      successCount++;
    }
  }

  console.log(`\n✅ Conversion complete! ${successCount}/${conversions.length} icons converted.`);

  // 列出所有图标文件
  console.log('\n📁 Current icons in directory:');
  const files = fs.readdirSync(iconsDir);
  files.forEach(file => {
    const stats = fs.statSync(path.join(iconsDir, file));
    console.log(`   ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
  });
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
