-- Migration 006: content_generations
-- Core table for AI generation requests and their outputs.
-- Columns are aligned to the actual frontend inputs (WorkflowKind + ContentCategory),
-- not to a platform-selection model that does not exist in the current UI.

CREATE TABLE public.content_generations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- WorkflowKind: the format the user chose on the generate page
  workflow_kind        text        NOT NULL DEFAULT 'single'
                                   CHECK (workflow_kind IN ('single', 'carousel', 'story', 'reel', 'campaign', 'festive')),
  -- ContentCategory: the content angle within the chosen workflow
  content_category     text        NOT NULL DEFAULT 'educational'
                                   CHECK (content_category IN (
                                     'educational', 'myth-fact', 'did-you-know', 'patient-faq',
                                     'health-tips', 'warning-signs', 'prevention', 'doctor-explains',
                                     'awareness', 'clinic-promo', 'greeting', 'reel-hook'
                                   )),
  specialty            text        NOT NULL,
  tone                 text        NOT NULL DEFAULT 'Professional',
  topic                text        NOT NULL,
  prompt_snapshot      jsonb,
  generated_text       text,
  generated_image_url  text,
  hashtags             text[]      NOT NULL DEFAULT '{}',
  status               text        NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft', 'published', 'archived')),
  is_favorite          boolean     NOT NULL DEFAULT false,
  ai_model             text,
  tokens_used          integer     CHECK (tokens_used >= 0),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER content_generations_updated_at
  BEFORE UPDATE ON public.content_generations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
-- Primary query pattern: "show my history, newest first"
CREATE INDEX idx_content_gen_user_created
  ON public.content_generations (user_id, created_at DESC);

-- History filter: by workflow kind (matches the type filter dropdown)
CREATE INDEX idx_content_gen_user_kind
  ON public.content_generations (user_id, workflow_kind);

-- History filter: by specialty
CREATE INDEX idx_content_gen_user_specialty
  ON public.content_generations (user_id, specialty);

-- Filter by status (drafts, published, archived)
CREATE INDEX idx_content_gen_user_status
  ON public.content_generations (user_id, status);

-- Favorites filter (partial: only indexes rows where true)
CREATE INDEX idx_content_gen_user_favorite
  ON public.content_generations (user_id, is_favorite)
  WHERE is_favorite = true;

-- Admin analytics: count by workflow_kind, date range
CREATE INDEX idx_content_gen_created_at ON public.content_generations (created_at DESC);

-- RLS
ALTER TABLE public.content_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_gen_owner_all"
  ON public.content_generations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "content_gen_admin_read"
  ON public.content_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON TABLE public.content_generations IS 'Every AI generation request. Drives both Content History UI and admin analytics.';
COMMENT ON COLUMN public.content_generations.workflow_kind IS 'Format chosen by user: single | carousel | story | reel | campaign | festive.';
COMMENT ON COLUMN public.content_generations.content_category IS 'Content angle: educational | myth-fact | health-tips | etc.';
COMMENT ON COLUMN public.content_generations.prompt_snapshot IS 'Full prompt payload sent to AI model. Stored for debugging and prompt replay.';
COMMENT ON COLUMN public.content_generations.generated_image_url IS 'Supabase Storage path under generated-content/{user_id}/{id}.ext';
COMMENT ON COLUMN public.content_generations.hashtags IS 'Parsed array of hashtag strings without the # prefix.';
COMMENT ON COLUMN public.content_generations.tokens_used IS 'Input + output tokens. Used for cost attribution and admin analytics.';
