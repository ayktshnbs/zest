const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '../public/products');
const productsJsonPath = path.join(__dirname, '../products.json');
const outputDataPath = path.join(__dirname, '../lib/products.ts');

// Identify available images in public/products
const availableFiles = fs.existsSync(destDir) ? fs.readdirSync(destDir) : [];
const availableImagesMap = new Map(); // zipName -> Array of images

availableFiles.forEach(file => {
    const zipName = file.split('_')[0];
    if (!availableImagesMap.has(zipName)) {
        availableImagesMap.set(zipName, []);
    }
    availableImagesMap.get(zipName).push(file);
});

// Now generate the static products.ts file with GROUPING and TURKISH
console.log('Generating grouped TURKISH lib/products.ts...');
const productsJson = JSON.parse(fs.readFileSync(productsJsonPath, 'utf8'));

const groups = new Map();

productsJson.forEach((p, index) => {
  const baseId = p.image ? p.image.split('_')[0] : `prod-${index}`;
  
  if (!groups.has(baseId)) {
    const categoryMapping = {
      "Kitchen & Dining": "Mutfak ve Yemek",
      "Storage": "Saklama Çözümleri",
      "Kitchenware": "Mutfak Gereçleri"
    };

    let turkishName = (p.title || p.name).split(' - ')[0];
    turkishName = turkishName.replace('Manual Food Chopper', 'Manuel El Rondosu');
    turkishName = turkishName.replace('Hand Blender', 'El Blenderı');
    turkishName = turkishName.replace('Coffee Mug', 'Kahve Kupası');
    turkishName = turkishName.replace('Storage Container', 'Saklama Kabı');
    turkishName = turkishName.replace('Water Bottle', 'Su Şişesi');
    turkishName = turkishName.replace('Beverage Server', 'İçecek Sunumluk');

    groups.set(baseId, {
      id: baseId.toLowerCase(),
      name: turkishName,
      description: "Yüksek kaliteli, dayanıklı ve şık mutfak gereçleri. Profesyonel ve ev kullanımı için idealdir.",
      price: (p.price || "").match(/\d+/) ? parseInt(p.price.match(/\d+/)[0]) : 0,
      category: categoryMapping[p.category] || p.category,
      images: [],
      rating: 5
    });
  }
});

const transformedProducts = Array.from(groups.values()).map(group => {
  const zipName = group.id.toUpperCase();
  if (availableImagesMap.has(zipName)) {
    const extracted = availableImagesMap.get(zipName).sort();
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
console.log(`Done. Grouped into ${transformedProducts.length} Turkish products.`);
