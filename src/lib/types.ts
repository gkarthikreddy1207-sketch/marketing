export type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  image: string | null;
  sort_order: number;
  is_featured: boolean;
};

export type ProductBadge =
  | 'featured'
  | 'trending'
  | 'best_seller'
  | 'new_arrival';

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  specs: Record<string, string>;
  price_cents: number;
  compare_at_cents: number | null;
  currency: string;
  category_id: string | null;
  brand: string | null;
  sku: string | null;
  stock: number;
  rating: number;
  reviews_count: number;
  badges: string[];
  is_featured: boolean;
  is_trending: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  primary_image: string | null;
  sort_order: number;
  created_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  sort_order: number;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  kind: 'percent' | 'fixed' | 'shipping';
  value: number;
  min_subtotal_cents: number;
  max_redemptions: number | null;
  redemptions_count: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type Order = {
  id: string;
  user_id: string | null;
  order_number: string;
  status: OrderStatus;
  payment_method: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  coupon_code: string | null;
  shipping_name: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal: string | null;
  shipping_country: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  sku: string | null;
  price_cents: number;
  qty: number;
  image: string | null;
};

export type Address = {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  line1: string;
  line2: string | null;
  city: string;
  postal: string;
  country: string;
  phone: string | null;
  is_default: boolean;
};

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  price_cents: number;
  image: string | null;
  qty: number;
  stock: number;
  max: number;
};

export type Currency = {
  code: string;
  symbol: string;
  label: string;
  rate: number; // multiplier from USD
};
