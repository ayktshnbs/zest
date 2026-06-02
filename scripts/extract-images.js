const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imgDir = path.join(__dirname, '../img');
const destDir = path.join(__dirname, '../public/products');
const productsJsonPath = path.join(__dirname, '../products.json');
const outputDataPath = path.join(__dirname, '../lib/products.ts');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Clear the directory first
if (fs.existsSync(destDir)) {
  const files = fs.readdirSync(destDir);
  for (const file of files) {
    fs.unlinkSync(path.join(destDir, file));
  }
}

const zips = fs.readdirSync(imgDir).filter(f => f.endsWith('.zip'));

console.log(`Found ${zips.length} zip files. Extracting 3 unique shots...`);

const availableImagesMap = new Map();

zips.forEach(zip => {
  const zipName = zip.replace('.zip', '');
  const tempDir = path.join(imgDir, `temp_${zipName}`);
  const extractedForThisZip = [];
  const seenFileStems = new Set();
  
  try {
    console.log(`Processing ${zip}...`);
    // Skip the 2.6GB file if we are low on space
    if (fs.statSync(path.join(imgDir, zip)).size > 1000000000) {
        console.log(`  Skipping ${zip} due to size (>1GB) to save disk space.`);
        return;
    }

    execSync(`powershell.exe -Command "Expand-Archive -Path '${path.join(imgDir, zip)}' -DestinationPath '${tempDir}' -Force"`);
    
    const findImages = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          results = results.concat(findImages(filePath));
        } else if (file.match(/\.(jpg|jpeg|png)$/i)) {
          results.push(filePath);
        }
      });
      return results;
    };

    const images = findImages(tempDir);
    
    images.sort((a, b) => {
        const extA = path.extname(a).toLowerCase();
        const extB = path.extname(b).toLowerCase();
        if (extA === '.jpg' && extB !== '.jpg') return -1;
        if (extA !== '.jpg' && extB === '.jpg') return 1;
        return 0;
    });

    let count = 0;
    for (const imgPath of images) {
      if (count >= 3) break; // Reduced to 3 unique shots
      
      const fileStem = path.basename(imgPath, path.extname(imgPath)).toLowerCase();
      if (seenFileStems.has(fileStem)) continue;
      
      let ext = path.extname(imgPath).toUpperCase();
      if (ext === '.JPEG') ext = '.JPG';
      
      const newName = `${zipName}_${count}${ext}`;
      const destPath = path.join(destDir, newName);
      fs.copyFileSync(imgPath, destPath);
      extractedForThisZip.push(newName);
      seenFileStems.add(fileStem);
      count++;
    }
    
    availableImagesMap.set(zipName, extractedForThisZip);
    console.log(`  Saved ${extractedForThisZip.length} unique images for ${zipName}`);

  } catch (err) {
    console.error(`Error processing ${zip}:`, err.message);
  } finally {
    if (fs.existsSync(tempDir)) {
      try {
        execSync(`powershell.exe -Command "Remove-Item -Path '${tempDir}' -Recurse -Force"`);
      } catch (e) {}
    }
  }
});

// Now generate the static products.ts file with GROUPING
console.log('Generating grouped lib/products.ts...');
const productsJson = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

const groups = new Map();

productsJson.forEach((p, index) => {
  const baseId = p.image ? p.image.split('_')[0] : `prod-${index}`;
  
  if (!groups.has(baseId)) {
    groups.set(baseId, {
      id: baseId.toLowerCase(),
      name: (p.title || p.name).split(' - ')[0],
      description: p.description,
      price: (p.price || "").match(/\d+/) ? parseInt(p.price.match(/\d+/)[0]) : 0,
      category: p.category,
      images: [],
      rating: 5
    });
  }
});

const transformedProducts = Array.from(groups.values()).map(group => {
  const zipName = group.id.toUpperCase();
  if (availableImagesMap.has(zipName) && availableImagesMap.get(zipName).length > 0) {
    const extracted = availableImagesMap.get(zipName);
    group.images = extracted.map(img => `/products/${img}`);
    group.imageUrl = group.images[0];
  } else {
    group.imageUrl = "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800";
    group.images = [group.imageUrl];
  }
  return group;
});

const fileContent = `import { Product } from "@/types";

export const products: Product[] = ${JSON.stringify(transformedProducts, null, 2)};
`;

fs.writeFileSync(outputDataPath, fileContent);
console.log(`Done. Grouped into ${transformedProducts.length} products.`);
