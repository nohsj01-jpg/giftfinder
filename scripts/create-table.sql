-- public.products 테이블 생성
CREATE TABLE IF NOT EXISTS public.products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  price_range text NOT NULL,
  price integer NOT NULL,
  gender text NOT NULL,
  age_group text NOT NULL,
  relationships text[] NOT NULL DEFAULT '{}',
  hobbies text[] NOT NULL DEFAULT '{}',
  personality text[] NOT NULL DEFAULT '{}',
  events text[] NOT NULL DEFAULT '{}',
  image_url text NULL,
  purchase_link text NULL,
  created_at timestamptz DEFAULT now(),

  -- CHECK 제약 조건
  CONSTRAINT check_category CHECK (category IN ('디지털/IT', '문구/데스크테리어', '취미/레저', '뷰티', '식품/커피', '패션잡화', '리빙/인테리어')),
  CONSTRAINT check_price_range CHECK (price_range IN ('1만원 이하', '1~3만원', '3~5만원', '5~10만원', '10만원 이상')),
  CONSTRAINT check_gender CHECK (gender IN ('남성', '여성', '상관없음')),
  CONSTRAINT check_age_group CHECK (age_group IN ('10대', '20대 초반', '20대 후반', '30대', '40대 이상'))
);

-- category, price_range, gender, age_group B-tree 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON public.products(price_range);
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products(gender);
CREATE INDEX IF NOT EXISTS idx_products_age_group ON public.products(age_group);

-- relationships, hobbies, personality, events GIN 인덱스 생성 (배열 포함 검색용)
CREATE INDEX IF NOT EXISTS idx_products_relationships ON public.products USING gin(relationships);
CREATE INDEX IF NOT EXISTS idx_products_hobbies ON public.products USING gin(hobbies);
CREATE INDEX IF NOT EXISTS idx_products_personality ON public.products USING gin(personality);
CREATE INDEX IF NOT EXISTS idx_products_events ON public.products USING gin(events);

-- RLS (Row Level Security) 설정
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. 비인증 유저(익명) 읽기 허용 정책
CREATE POLICY "Allow public read access for anon" ON public.products
  FOR SELECT TO anon USING (true);

-- 2. 인증 유저 읽기 허용 정책
CREATE POLICY "Allow read access for authenticated" ON public.products
  FOR SELECT TO authenticated USING (true);

-- PostgREST API 접근을 위한 명시적 GRANT 권한 부여 (AGENTS.md 수칙 준수)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
