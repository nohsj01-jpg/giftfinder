<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:supabase-policy-rules -->
# Supabase 테이블 생성 및 액세스 정책

테이블을 생성하거나 액세스하는 SQL을 작성할 때 아래 사항을 **반드시** 적용한다.

## 1. GRANT (PostgREST API 접근 권한)

`anon`과 `authenticated` 역할이 PostgREST API를 통해 테이블에 접근할 수 있도록 명시적인 GRANT 문을 반드시 포함한다.

```sql
-- 예시: my_table 테이블에 대한 GRANT
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_table TO authenticated;
```

- 테이블 용도에 따라 필요한 권한만 부여한다 (예: 읽기 전용이면 SELECT만).
- 시퀀스가 있는 경우 `GRANT USAGE, SELECT ON SEQUENCE` 도 함께 포함한다.

## 2. RLS (Row Level Security)

모든 테이블에 RLS를 활성화하고, 인증된 유저(`authenticated`)만 본인 데이터에 접근할 수 있도록 Policy를 작성한다.

```sql
-- 예시: my_table 테이블에 대한 RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- 인증된 유저만 본인의 데이터를 읽을 수 있음
CREATE POLICY "Users can read own data"
  ON public.my_table
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 인증된 유저만 본인의 데이터를 생성할 수 있음
CREATE POLICY "Users can insert own data"
  ON public.my_table
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 인증된 유저만 본인의 데이터를 수정할 수 있음
CREATE POLICY "Users can update own data"
  ON public.my_table
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 인증된 유저만 본인의 데이터를 삭제할 수 있음
CREATE POLICY "Users can delete own data"
  ON public.my_table
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

- `user_id` 컬럼은 `uuid REFERENCES auth.users(id)` 타입으로 생성한다.
- 공개 읽기가 필요한 테이블은 `anon`에 대한 SELECT Policy를 추가한다.
- 테이블 용도에 맞게 Policy 범위를 조정한다.
<!-- END:supabase-policy-rules -->
