export type Category = 'earrings' | 'necklaces' | 'rings' | 'bracelets';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  images?: string[];
  inStock: boolean;
  featured?: boolean;
  material?: string;
  color?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerInfo;
  total: number;
  paymentMethod: 'mpesa' | 'card';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  description: string;
  image: string;
}
