-- orders 테이블에 토스페이먼츠 연동을 위한 필드 추가 및 기본값 수정

-- 1. status 컬럼의 기본값(Default)을 'pending'으로 설정 변경
ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'pending';

-- 2. 토스페이먼츠 연동 컬럼 추가 (toss_payment_key, toss_order_id)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS toss_payment_key text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS toss_order_id text;
