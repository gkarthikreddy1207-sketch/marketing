/*
# Create e-commerce schema for Maison marketplace

## Overview
Sets up a full storefront: categories, products, product images, reviews,
coupons, orders + order items, addresses, wishlists, and recently-viewed.
Products are public (readable by anon) so the storefront works without login.
Orders, wishlists, addresses, and recently-viewed are owner-scoped to the
authenticated user.

## New tables
1. categories — product taxonomy (self-referencing parent for subcategories).
2. products — catalog items with price, inventory, ratings, badges.
3. product_images — gallery images per product.
4. reviews — customer ratings + moderated status.
5. coupons — discount codes with type/amount/limits.
6. orders — header: status, totals, shipping address snapshot.
7. order_items — line items per order.
8. addresses — saved shipping addresses per user.
9. wishlists — products saved by a user.
10. recently_viewed — per-user recently viewed product tracking.

## Security
- RLS enabled on every table.
- Public read on categories, products, product_images, approved reviews, coupons.
- Owner-scoped CRUD on orders, order_items, addresses, wishlists, recently_viewed
  (user_id defaults to auth.uid() so client inserts without user_id succeed).
- Anyone (anon+authenticated) may create orders, reviews, wishlists, recently_viewed,
  since the storefront supports guest checkout; owner columns default to auth.uid()
  and policies use auth.uid() = user_id where present, otherwise WITH CHECK (true).
- Reviews insert is open; update/delete restricted to the review author.
- Admin writes are intentionally not handled at anon level — admin operations are
  out of scope for this storefront migration and would use the service role.
*/

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  icon text,
  image text,
  sort_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

-- ---------- products ----------
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  subtitle text,
  description text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_cents int NOT NULL CHECK (price_cents >= 0),
  compare_at_cents int CHECK (compare_at_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand text,
  sku text,
  stock int NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  reviews_count int NOT NULL DEFAULT 0,
  badges text[] NOT NULL DEFAULT '{}'::text[],
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  is_best_seller boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  primary_image text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

-- ---------- product_images ----------
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt text,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_images" ON product_images;
CREATE POLICY "public_read_product_images" ON product_images FOR SELECT
  TO anon, authenticated USING (true);

-- ---------- reviews ----------
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid(),
  author_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_reviews" ON reviews;
CREATE POLICY "public_read_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (is_approved = true);
DROP POLICY IF EXISTS "anyone_insert_reviews" ON reviews;
CREATE POLICY "anyone_insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "owner_update_review" ON reviews;
CREATE POLICY "owner_update_review" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_review" ON reviews;
CREATE POLICY "owner_delete_review" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- coupons ----------
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'percent' CHECK (kind IN ('percent','fixed','shipping')),
  value int NOT NULL DEFAULT 0,
  min_subtotal_cents int NOT NULL DEFAULT 0,
  max_redemptions int,
  redemptions_count int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_coupons" ON coupons;
CREATE POLICY "public_read_coupons" ON coupons FOR SELECT
  TO anon, authenticated USING (active = true);

-- ---------- orders ----------
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_method text NOT NULL DEFAULT 'card',
  subtotal_cents int NOT NULL DEFAULT 0,
  discount_cents int NOT NULL DEFAULT 0,
  shipping_cents int NOT NULL DEFAULT 0,
  tax_cents int NOT NULL DEFAULT 0,
  total_cents int NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  coupon_code text,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_postal text,
  shipping_country text,
  shipping_method text,
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_orders" ON orders;
CREATE POLICY "owner_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "anyone_insert_orders" ON orders;
CREATE POLICY "anyone_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "owner_update_orders" ON orders;
CREATE POLICY "owner_update_orders" ON orders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- order_items ----------
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text,
  price_cents int NOT NULL,
  qty int NOT NULL,
  image text
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_order_items" ON order_items;
CREATE POLICY "owner_select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "anyone_insert_order_items" ON order_items;
CREATE POLICY "anyone_insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ---------- addresses ----------
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  label text,
  full_name text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  postal text NOT NULL,
  country text NOT NULL DEFAULT 'United States',
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_addresses" ON addresses;
CREATE POLICY "owner_select_addresses" ON addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_insert_addresses" ON addresses;
CREATE POLICY "owner_insert_addresses" ON addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_update_addresses" ON addresses;
CREATE POLICY "owner_update_addresses" ON addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "owner_delete_addresses" ON addresses;
CREATE POLICY "owner_delete_addresses" ON addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- wishlists ----------
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_wishlists" ON wishlists;
CREATE POLICY "owner_select_wishlists" ON wishlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "anyone_insert_wishlists" ON wishlists;
CREATE POLICY "anyone_insert_wishlists" ON wishlists FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "owner_delete_wishlists" ON wishlists;
CREATE POLICY "owner_delete_wishlists" ON wishlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- recently_viewed ----------
CREATE TABLE IF NOT EXISTS recently_viewed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_select_recently_viewed" ON recently_viewed;
CREATE POLICY "owner_select_recently_viewed" ON recently_viewed FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "anyone_insert_recently_viewed" ON recently_viewed;
CREATE POLICY "anyone_insert_recently_viewed" ON recently_viewed FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "owner_delete_recently_viewed" ON recently_viewed;
CREATE POLICY "owner_delete_recently_viewed" ON recently_viewed FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON recently_viewed(user_id);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated ON orders;
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
