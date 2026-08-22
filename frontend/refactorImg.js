import fs from 'fs';
import path from 'path';

const walk = function(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
};

const files = walk('./src/pages');

let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // We will look for <img src={product.image} ... /> or <img src={item.image} ... />
    // And replace it with <ProductImage product={product} ... />
    
    // Very naive replace for Cart, Marketplace, etc:
    // It's much safer to replace specific known patterns because AST replacing in regex is hard.
    
    if (content.includes('<img src={item.image}')) {
        content = content.replace(/<img[^>]*src={item\.image}[^>]*\/>/g, (match) => {
            // extract className
            const classMatch = match.match(/className="([^"]+)"/);
            const className = classMatch ? classMatch[1] : "";
            return `<ProductImage product={item} className="${className}" />`;
        });
        changed = true;
    }
    
    if (content.includes('<img src={product.image}')) {
        content = content.replace(/<img[^>]*src={product\.image}[^>]*\/>/g, (match) => {
            // extract className
            const classMatch = match.match(/className="([^"]+)"/);
            const className = classMatch ? classMatch[1] : "";
            return `<ProductImage product={product} className="${className}" />`;
        });
        changed = true;
    }

    if (content.includes('<img') && content.includes('src={item.image}')) {
         // handle multi-line img tags (like in ProductDetails)
         content = content.replace(/<img[^>]*src={item\.image}[^>]*\/>/gms, (match) => {
            const classMatch = match.match(/className="([^"]+)"/);
            const className = classMatch ? classMatch[1] : "";
            return `<ProductImage product={item} className="${className}" />`;
        });
    }

    if (changed) {
        // Ensure ProductImage is imported
        if (!content.includes('ProductImage')) {
            // Find depth
            const depth = file.split(path.sep).length - 3;
            const prefix = '../'.repeat(depth) || './';
            const importStmt = `import ProductImage from '${prefix}components/shared/ProductImage';\n`;
            content = importStmt + content;
        }
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
        modifiedCount++;
    }
});

console.log('Modified ' + modifiedCount + ' files.');
