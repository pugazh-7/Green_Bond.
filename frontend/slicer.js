import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const outDir = './src/assets/icons';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

async function sliceGrid(filename, rows, cols, prefix) {
    const img = await Jimp.read(`./src/assets/greenbond/${filename}`);
    const w = Math.floor(img.bitmap.width / cols);
    const h = Math.floor(img.bitmap.height / rows);

    let count = 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const clone = img.clone();
            clone.crop({ x: c * w, y: r * h, w: w, h: h });
            // basic threshold/trim could be added, but we'll just save it
            await clone.write(`./src/assets/icons/${prefix}_${count}.jpg`);
            count++;
        }
    }
}

async function main() {
    await sliceGrid('marketplace_icons_sheet_1787333187228.jpg', 3, 4, 'market');
    await sliceGrid('shopping_categories_sheet_1787333206059.jpg', 4, 4, 'shopcat');
    await sliceGrid('quick_delivery_sheet_1787333220449.jpg', 2, 4, 'quick');
    await sliceGrid('fresh_farmer_sheet_1787333310404.jpg', 2, 5, 'fresh');
    await sliceGrid('user_account_sheet_1787333322901.jpg', 3, 5, 'user');
    await sliceGrid('order_delivery_sheet_1787333356593.jpg', 3, 4, 'order');
    console.log("Done slicing!");
}
main();
