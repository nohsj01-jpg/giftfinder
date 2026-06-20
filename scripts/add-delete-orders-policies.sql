-- orders 및 order_items 테이블에 DELETE(삭제) 권한 부여 및 RLS 정책 생성

-- 1. orders 테이블 DELETE RLS 정책 추가
DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;
CREATE POLICY "Users can delete own orders"
  ON public.orders FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- PostgREST API DELETE 접근 권한 부여
GRANT DELETE ON public.orders TO anon;
GRANT DELETE ON public.orders TO authenticated;


-- 2. order_items 테이블 DELETE RLS 정책 추가
DROP POLICY IF EXISTS "Users can delete own order items" ON public.order_items;
CREATE POLICY "Users can delete own order items"
  ON public.order_items FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- PostgREST API DELETE 접근 권한 부여
GRANT DELETE ON public.order_items TO anon;
GRANT DELETE ON public.order_items TO authenticated;
