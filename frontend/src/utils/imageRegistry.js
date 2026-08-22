// Product Images
import productMilk from '../assets/greenbond/product_milk_1787333689005.jpg';
import productTomato from '../assets/greenbond/product_tomato_1787333556436.jpg';
import productTshirt from '../assets/greenbond/product_tshirt_1787333710109.jpg';

// Category Cards
import catFresh from '../assets/greenbond/category_fresh_1787333502825.jpg';
import catGrocery from '../assets/greenbond/category_grocery_1787333490452.jpg';
import catMilk from '../assets/greenbond/category_milk_1787333532111.jpg';
import catQuick from '../assets/greenbond/category_quick_1787333514775.jpg';

// Icon Category Cards (used as specific product fallbacks)
import shopcat_1 from '../assets/icons/shopcat_1.jpg'; // Electronics
import shopcat_3 from '../assets/icons/shopcat_3.jpg'; // Grocery / Rice
import shopcat_7 from '../assets/icons/shopcat_7.jpg'; // Personal Care / Soap / Shampoo

// General Fallback
const nanoBananaPlaceholder = '/nano_banana.jpg';

export const productImageRegistry = {
    // Exact Matches (Normalized)
    'amul milk 500ml': productMilk,
    'amul milk': productMilk,
    'tomato 1kg': productTomato,
    'tomato': productTomato,
    "men's cotton t-shirt": productTshirt,
    't-shirt': productTshirt,
    'shirt': productTshirt,
    
    // Requested exact match products (Mapped to category assets due to quota limits)
    "pear's pure & gentle soap": shopcat_7, // Personal Care
    'soap': shopcat_7,
    'india gate basmati rice': shopcat_3, // Grocery
    'basmati rice': shopcat_3,
    'rice': shopcat_3,
    'sony wh-1000xm5': shopcat_1, // Electronics
    'headphones': shopcat_1,
    'mamaearth onion shampoo': shopcat_7, // Personal Care
    'shampoo': shopcat_7,
    
    // Fallbacks to Category Cards based on Tags/Categories
    'fresh': catFresh,
    'vegetables': catFresh,
    'fruits': catFresh,
    'greens': catFresh,
    'farmer': catFresh,
    
    'grocery': catGrocery,
    'grains': catGrocery,
    'pulses': catGrocery,
    'snacks': catGrocery,
    
    'milk': catMilk,
    'dairy': catMilk,
    
    'quick': catQuick,
    'fast': catQuick,
    'electronics': catQuick, // generic fast-commerce fallback
    
    'default': nanoBananaPlaceholder
};
