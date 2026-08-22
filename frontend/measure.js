import { Jimp } from 'jimp';

async function main() {
    const img = await Jimp.read('./src/assets/greenbond/marketplace_icons_sheet_1787333187228.jpg');
    console.log(`Width: ${img.bitmap.width}, Height: ${img.bitmap.height}`);
}
main();
