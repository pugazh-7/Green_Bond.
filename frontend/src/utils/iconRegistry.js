import {
    ShoppingBagIcon, ZapIcon, LeafIcon, LayoutGridIcon, 
    MonitorIcon, ShirtIcon, CarrotIcon, CookieIcon, 
    CoffeeIcon, DropletIcon, SparklesIcon, HomeIcon, BoxIcon,
    GiftIcon, SmartphoneIcon, SprayIcon, LaptopIcon, SmileIcon, 
    ShoeIcon, IceCreamIcon, WheatIcon, PillIcon, ChairIcon
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
    furniture: ChairIcon,
    furnitures: ChairIcon,
    medicines: PillIcon,
    medicine: PillIcon,
    madisance: PillIcon,
    pharmacy: PillIcon,
    fashion: ShirtIcon,
    grocery: BoxIcon,
    snacks: CookieIcon,
    drinks: CoffeeIcon,
    'milk & dairy': DropletIcon,
    milk: DropletIcon,
    dairy: DropletIcon,
    'personal care': SparklesIcon,
    household: HomeIcon,
    beauty: SparklesIcon,
    accessories: ShirtIcon,
    mobiles: SmartphoneIcon,
    laptops: LaptopIcon,
    footwear: ShoeIcon,
    men: ShirtIcon,
    women: SparklesIcon,
    kids: SmileIcon,
    vegetables: CarrotIcon,
    'fresh vegetables': CarrotIcon,
    fruits: CarrotIcon,
    greens: LeafIcon,
    'leafy greens': LeafIcon,
    'bread & bakery': BoxIcon,
    'bread & butter': BoxIcon,
    bread: BoxIcon,
    bakery: BoxIcon,
    eggs: BoxIcon,
    meat: BoxIcon,
    water: DropletIcon,
    chocolates: CookieIcon,
    biscuits: CookieIcon,
    juices: CoffeeIcon,
    'ice cream': IceCreamIcon,
    'mobile accessories': MonitorIcon,
    chargers: ZapIcon,
    cables: ZapIcon,
    earphones: ZapIcon,
    gifts: GiftIcon,
    'daily essentials': BoxIcon,
    'fashion essentials': ShirtIcon,
    grains: WheatIcon,
    organic: LeafIcon,
    'farm produce': LeafIcon,
    seasonal: CarrotIcon,
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
