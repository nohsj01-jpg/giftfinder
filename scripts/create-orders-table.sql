-- 1. orders 테이블 생성
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ordered_at timestamptz NOT NULL DEFAULT now(),
  total_price int8 NOT NULL,
  status text NOT NULL DEFAULT 'completed' CONSTRAINT check_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- RLS 활성화
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정 (본인 데이터만 SELECT / INSERT 허용)
CREATE POLICY "Users can read own orders"
  ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- PostgREST API 접근을 위한 GRANT 권한 부여
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT ON public.orders TO authenticated;


-- 2. order_items 테이블 생성
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text REFERENCES public.giftfinder(상품명) ON DELETE SET NULL,
  product_name text NOT NULL,
  price int8 NOT NULL
);

-- RLS 활성화
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정 (주문서 소유자 본인의 아이템만 SELECT / INSERT 허용)
CREATE POLICY "Users can read own order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- PostgREST API 접근을 위한 GRANT 권한 부여
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
