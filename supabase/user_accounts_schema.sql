

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
-- Stores additional user information beyond what's in auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. USER ADDRESSES TABLE
-- ============================================
-- Stores multiple shipping addresses per user
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Kenya',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. USER PAYMENT METHODS TABLE
-- ============================================
-- Stores payment method preferences (minimal secure info only)
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mpesa', 'card')),
  last_four TEXT, -- Last 4 digits for cards
  phone TEXT, -- For M-Pesa phone number
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. USER WISHLISTS TABLE
-- ============================================
-- Stores wishlist items in database (synced across devices)
CREATE TABLE IF NOT EXISTS user_wishlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id) -- Prevent duplicate wishlist items
);

-- ============================================
-- 5. USER CARTS TABLE (OPTIONAL)
-- ============================================
-- Stores cart items in database (for cart persistence across devices)
CREATE TABLE IF NOT EXISTS user_carts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id) -- One cart entry per product per user
);

-- ============================================
-- 6. UPDATE ORDERS TABLE
-- ============================================
-- Add user_id column to link orders to user accounts (nullable for guest orders)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- ============================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON user_addresses(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_is_default ON user_payment_methods(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_user_wishlists_user_id ON user_wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wishlists_product_id ON user_wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS POLICIES FOR USER_PROFILES
-- ============================================
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 10. RLS POLICIES FOR USER_ADDRESSES
-- ============================================
CREATE POLICY "Users can view their own addresses" ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 11. RLS POLICIES FOR USER_PAYMENT_METHODS
-- ============================================
CREATE POLICY "Users can view their own payment methods" ON user_payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON user_payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON user_payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON user_payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 12. RLS POLICIES FOR USER_WISHLISTS
-- ============================================
CREATE POLICY "Users can view their own wishlist" ON user_wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON user_wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON user_wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 13. RLS POLICIES FOR USER_CARTS
-- ============================================
CREATE POLICY "Users can view their own cart" ON user_carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON user_carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items" ON user_carts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items" ON user_carts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 14. UPDATE ORDERS RLS POLICIES
-- ============================================
-- Drop all existing orders policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public order inserts" ON orders;
DROP POLICY IF EXISTS "Allow authenticated order reads" ON orders;
DROP POLICY IF EXISTS "Allow authenticated order updates" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- INSERT Policy: Allow anonymous and authenticated users to create orders
-- - Anonymous users can create orders (user_id = null) for guest checkout
-- - Authenticated users can create orders with their own user_id
CREATE POLICY "Allow public order inserts" ON orders
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL OR 
    user_id = auth.uid()
  );

-- SELECT Policy: Allow users to view their own orders
-- - Users can see their own orders (where user_id = their id)
-- - Authenticated users (admins) can see all orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT 
  TO anon, authenticated
  USING (
    user_id IS NULL OR
    user_id = auth.uid() OR
    auth.role() = 'authenticated'
  );

-- UPDATE Policy: Only authenticated users (admins) can update orders
CREATE POLICY "Allow authenticated order updates" ON orders
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 15. FUNCTION TO AUTO-CREATE USER PROFILE
-- ============================================
-- This function automatically creates a user_profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
