import {
    ShoppingBagIcon, ZapIcon, LeafIcon, LayoutGridIcon, 
    MonitorIcon, ShirtIcon, CarrotIcon, CookieIcon, 
    CoffeeIcon, DropletIcon, SparklesIcon, HomeIcon, BoxIcon,
    GiftIcon, SmartphoneIcon, SprayIcon
} from './Icons';

export const iconRegistry = {
    shopping: ShoppingBagIcon,
    marketplace: ShoppingBagIcon,
    categories: LayoutGridIcon,
    search: BoxIcon,
    filter: BoxIcon,
    cart: ShoppingBagIcon,
    wishlist: ZapIcon,
    quick: ZapIcon,
    fast: ZapIcon,
    fresh: LeafIcon,
    farmer: LeafIcon,
    location: HomeIcon,
    orders: BoxIcon,
    tracking: BoxIcon,
    payment: BoxIcon,
    upi: BoxIcon,
    settings: BoxIcon,
    profile: BoxIcon,
    'default': LayoutGridIcon
};

export const categoryIcons = {
    all: LayoutGridIcon,
    electronics: MonitorIcon,
    fashion: ShirtIcon,
    grocery: BoxIcon,
    snacks: CookieIcon,
    drinks: CoffeeIcon,
    'milk & dairy': DropletIcon,
    milk: DropletIcon,
    'personal care': SparklesIcon,
    household: HomeIcon,
    beauty: SparklesIcon,
    accessories: ShirtIcon,
    mobiles: MonitorIcon,
    laptops: MonitorIcon,
    footwear: ShirtIcon,
    vegetables: CarrotIcon,
    'fresh vegetables': CarrotIcon,
    fruits: CarrotIcon,
    greens: LeafIcon,
    'bread & butter': BoxIcon,
    bread: BoxIcon,
    bakery: BoxIcon,
    eggs: BoxIcon,
    meat: BoxIcon,
    water: DropletIcon,
    chocolates: CookieIcon,
    biscuits: CookieIcon,
    juices: CoffeeIcon,
    'mobile accessories': MonitorIcon,
    chargers: ZapIcon,
    cables: ZapIcon,
    earphones: ZapIcon,
    gifts: GiftIcon,
    mobiles: SmartphoneIcon,
    'daily essentials': BoxIcon,
    'fashion essentials': ShirtIcon,
    'default': LayoutGridIcon
};

export const resolveIcon = (name) => {
    if (!name) return iconRegistry['default'];
    const normalized = name.toLowerCase().trim();
    return iconRegistry[normalized] || iconRegistry['default'];
};

export const resolveCategoryIcon = (name) => {
    if (!name) return categoryIcons['default'];
    const normalized = name.toLowerCase().trim();
    return categoryIcons[normalized] || categoryIcons['default'];
};
