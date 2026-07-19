import { supabase } from './supabase';
import type { Category, Coupon, Order, OrderItem, Product, ProductImage, Review } from './types';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchProducts(opts: {
  category?: string | null;
  search?: string;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sort?: string;
  limit?: number;
  page?: number;
  ids?: string[];
} = {}): Promise<{ items: Product[]; total: number }> {
  let q = supabase.from('products').select('*', { count: 'exact' });
  if (opts.category) {
    // match by category slug via join is complex; we filter client-side after fetching by slug map.
    // Instead we fetch category id first.
  }
  if (opts.search) {
    q = q.or(`name.ilike.%${opts.search}%,subtitle.ilike.%${opts.search}%,brand.ilike.%${opts.search}%`);
  }
  if (opts.featured) q = q.eq('is_featured', true);
  if (opts.trending) q = q.eq('is_trending', true);
  if (opts.bestSeller) q = q.eq('is_best_seller', true);
  if (opts.newArrival) q = q.eq('is_new_arrival', true);
  if (opts.brand) q = q.eq('brand', opts.brand);
  if (opts.minPrice !== undefined) q = q.gte('price_cents', opts.minPrice);
  if (opts.maxPrice !== undefined) q = q.lte('price_cents', opts.maxPrice);
  if (opts.ids && opts.ids.length) q = q.in('id', opts.ids);

  const sort = opts.sort || 'featured';
  switch (sort) {
    case 'price-asc':
      q = q.order('price_cents', { ascending: true });
      break;
    case 'price-desc':
      q = q.order('price_cents', { ascending: false });
      break;
    case 'rating':
      q = q.order('rating', { ascending: false });
      break;
    case 'newest':
      q = q.order('created_at', { ascending: false });
      break;
    default:
      q = q.order('sort_order', { ascending: true });
  }

  const page = opts.page ?? 1;
  const limit = opts.limit ?? 12;
  const start = (page - 1) * limit;
  q = q.range(start, start + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data ?? []) as Product[], total: count ?? 0 };
}

export async function fetchProductsByCategorySlug(slug: string, opts: Parameters<typeof fetchProducts>[0] = {}): Promise<{ items: Product[]; total: number }> {
  const { data: cat } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle();
  if (!cat) return { items: [], total: 0 };
  // include subcategory products: fetch child category ids
  const { data: children } = await supabase.from('categories').select('id').eq('parent_id', cat.id);
  const ids = [cat.id, ...(children ?? []).map((c) => c.id)];
  let q = supabase.from('products').select('*', { count: 'exact' }).in('category_id', ids);
  if (opts.search) q = q.or(`name.ilike.%${opts.search}%,subtitle.ilike.%${opts.search}%,brand.ilike.%${opts.search}%`);
  if (opts.minPrice !== undefined) q = q.gte('price_cents', opts.minPrice);
  if (opts.maxPrice !== undefined) q = q.lte('price_cents', opts.maxPrice);
  if (opts.brand) q = q.eq('brand', opts.brand);
  if (opts.ids && opts.ids.length) q = q.in('id', opts.ids);

  const sort = opts.sort || 'featured';
  switch (sort) {
    case 'price-asc': q = q.order('price_cents', { ascending: true }); break;
    case 'price-desc': q = q.order('price_cents', { ascending: false }); break;
    case 'rating': q = q.order('rating', { ascending: false }); break;
    case 'newest': q = q.order('created_at', { ascending: false }); break;
    default: q = q.order('sort_order', { ascending: true });
  }
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 12;
  const start = (page - 1) * limit;
  q = q.range(start, start + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { items: (data ?? []) as Product[], total: count ?? 0 };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductImage[];
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function fetchRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (!product.category_id) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .order('rating', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function fetchCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data as Coupon | null;
}

export async function createOrder(payload: {
  order_number: string;
  status: string;
  payment_method: string;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  coupon_code: string | null;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal: string;
  shipping_country: string;
  shipping_method: string;
  notes?: string | null;
}, items: Omit<OrderItem, 'id' | 'order_id'>[]) {
  const { data, error } = await supabase.from('orders').insert(payload).select().single();
  if (error) throw error;
  const order = data as Order;
  const rows = items.map((i) => ({ ...i, order_id: order.id }));
  const { error: ie } = await supabase.from('order_items').insert(rows);
  if (ie) throw ie;
  return order;
}

export async function fetchOrders(userId: string): Promise<(Order & { items?: OrderItem[] })[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as (Order & { items?: OrderItem[] })[];
}

export async function fetchOrderById(id: string): Promise<(Order & { items?: OrderItem[] }) | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as (Order & { items?: OrderItem[] }) | null;
}

export async function insertReview(payload: {
  product_id: string;
  author_name: string;
  rating: number;
  title?: string | null;
  body?: string | null;
}) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({ ...payload, is_approved: true })
    .select()
    .single();
  if (error) throw error;
  return data as Review;
}
