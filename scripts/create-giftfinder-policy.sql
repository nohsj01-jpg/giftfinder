-- public.giftfinder 테이블에 대한 RLS 설정 및 정책 부여
-- 이 스크립트를 Supabase SQL Editor에서 실행하면 클라이언트(anon)가 상품 상세 정보(실제가격 등)를 정상적으로 조회할 수 있게 됩니다.

-- 1. Row Level Security 활성화
ALTER TABLE public.giftfinder ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책이 있을 경우 삭제 후 재생성
DROP POLICY IF EXISTS "Allow public read access for anon" ON public.giftfinder;
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.giftfinder;

-- 3. 비인증 유저(anon) 읽기 허용 정책 추가
CREATE POLICY "Allow public read access for anon" ON public.giftfinder
  FOR SELECT TO anon USING (true);

-- 4. 인증 유저(authenticated) 읽기 허용 정책 추가
CREATE POLICY "Allow read access for authenticated" ON public.giftfinder
  FOR SELECT TO authenticated USING (true);

-- 4. PostgREST API 접근을 위한 SELECT 권한 명시적 부여 (RULE[AGENTS.md] 수칙 준수)
GRANT SELECT ON public.giftfinder TO anon;
GRANT SELECT ON public.giftfinder TO authenticated;
