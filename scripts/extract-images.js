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

console.log(`Found ${zips.length} zip files. Extracting 1 sample image per zip...`);

const availableImages = new Set();

zips.forEach(zip => {
  const zipName = zip.replace('.zip', '');
  const tempDir = path.join(imgDir, `temp_${zipName}`);
  
  try {
    console.log(`Processing ${zip}...`);
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
    
    if (images.length > 0) {
      const imgPath = images[0];
      let ext = path.extname(imgPath).toUpperCase();
      if (ext === '.JPEG') ext = '.JPG';
      
      const newName = `${zipName}_0${ext}`;
      const destPath = path.join(destDir, newName);
      fs.copyFileSync(imgPath, destPath);
      availableImages.add(newName);
      console.log(`  Saved ${newName}`);
    }

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

// Now generate the static products.ts file
console.log('Generating lib/products.ts...');
const productsJson = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

const transformedProducts = productsJson.map((p, index) => {
  const priceMatch = (p.price || "").match(/\d+/);
  const price = priceMatch ? parseInt(priceMatch[0]) : 0;
  const id = p.image ? p.image.split('.')[0].toLowerCase() : `prod-${index}`;
  
  let imageUrl = "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&q=80&w=800";
  
  if (p.image) {
    if (availableImages.has(p.image)) {
      imageUrl = `/products/${p.image}`;
    } else {
      const prefix = p.image.split('_')[0];
      const fallbackJpg = `${prefix}_0.JPG`;
      const fallbackPng = `${prefix}_0.PNG`;
      
      if (availableImages.has(fallbackJpg)) {
        imageUrl = `/products/${fallbackJpg}`;
      } else if (availableImages.has(fallbackPng)) {
        imageUrl = `/products/${fallbackPng}`;
      }
    }
  }
  
  return {
    id,
    name: p.title || p.name,
    description: p.description,
    price,
    category: p.category,
    imageUrl,
    rating: 5,
  };
});

const fileContent = `import { Product } from "@/types";

export const products: Product[] = ${JSON.stringify(transformedProducts, null, 2)};
`;

fs.writeFileSync(outputDataPath, fileContent);
console.log('Done.');
