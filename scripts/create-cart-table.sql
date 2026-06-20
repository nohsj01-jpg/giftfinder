-- public.cart_items 테이블 생성
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.giftfinder(상품명) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  
  -- user_id와 product_id 조합에 대한 unique 제약 조건 추가 (중복 담기 방지)
  CONSTRAINT unique_user_product UNIQUE (user_id, product_id)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 1. 인증된 사용자는 본인의 장바구니 아이템만 조회(SELECT) 가능
CREATE POLICY "Users can read own cart items"
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. 인증된 사용자는 본인의 장바구니 아이템만 추가(INSERT) 가능
CREATE POLICY "Users can insert own cart items"
  ON public.cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. 인증된 사용자는 본인의 장바구니 아이템만 삭제(DELETE) 가능
CREATE POLICY "Users can delete own cart items"
  ON public.cart_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- PostgREST API 접근을 위한 명시적 GRANT 권한 부여 (RULE[AGENTS.md] 수칙 준수)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
