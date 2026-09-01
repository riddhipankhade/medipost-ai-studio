-- Migration 014: template catalog foundation
--
-- Establishes the minimum data model for a database-backed template catalog:
-- browsable/favoritable rows that reference existing, code-defined renderers
-- through a stable render_key. Layout/rendering itself stays in code -- this
-- table stores catalog metadata only (name, category, specialty relevance,
-- format, archetype grouping, gating, ordering), never layout/position data.
--
-- No rows are seeded here -- this migration creates structure only. Content
-- authoring for the 30-template catalog is a separate, later step.

CREATE TABLE public.templates (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  render_key     text        NOT NULL,
  name           text        NOT NULL,
  description    text,
  category       text        NOT NULL
                              CHECK (category IN (
                                'educational', 'myth-fact', 'did-you-know', 'patient-faq',
                                'health-tips', 'warning-signs', 'prevention', 'doctor-explains',
                                'awareness', 'clinic-promo', 'greeting', 'reel-hook'
                              )),
  specialty_tags text[]      NOT NULL DEFAULT '{}',
  format         text        NOT NULL DEFAULT 'template'
                              CHECK (format IN ('single', 'carousel', 'story', 'reel', 'campaign', 'festive', 'template')),
  archetype      text        NOT NULL,
  premium        boolean     NOT NULL DEFAULT false,
  status         text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft', 'published', 'deprecated')),
  sort_order     integer     NOT NULL DEFAULT 0,
  schema_version integer     NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes -- match the primary browsing/filtering query patterns (status +
-- category/format/specialty facets), same style as content_generations'
-- indexes (migration 006).
CREATE INDEX idx_templates_status  ON public.templates (status);
CREATE INDEX idx_templates_category ON public.templates (category) WHERE status = 'published';
CREATE INDEX idx_templates_format   ON public.templates (format) WHERE status = 'published';
CREATE INDEX idx_templates_sort_order ON public.templates (sort_order);

-- GIN index for specialty_tags array-containment queries ("templates relevant
-- to cardiology"). New indexing pattern for this schema (content_generations
-- .hashtags is a plain text[] with no index, because it's never filtered on
-- in a query -- specialty_tags will be, so the extra index is justified by
-- actual query need, not precedent-copying).
CREATE INDEX idx_templates_specialty_tags ON public.templates USING GIN (specialty_tags);

-- RLS: catalog is read-visible to any authenticated user once published
-- (browsing the library), full access restricted to admins. Mirrors
-- plans_public_read / plans_admin_all (migrations 002 + 003).
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_public_read"
  ON public.templates FOR SELECT
  USING (
    status = 'published'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "templates_admin_all"
  ON public.templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.templates IS 'Browsable template catalog metadata. Rendering itself stays in code -- render_key is a stable lookup key into a static, code-defined set of renderer components (see src/components/template-frames.tsx), never a dynamic import or executable value.';
COMMENT ON COLUMN public.templates.render_key IS 'Resolves to an existing React frame/archetype component via a static allowlist lookup (e.g. getTemplateFrame() in template-frames.tsx). Deliberately NOT a DB CHECK constraint -- CHECK constraints drift out of sync with code (see migration 010''s history, where workflow_kind''s CHECK silently fell behind the app for an unknown period). The canonical list of valid values lives in code and must be enforced there, at read time, before this column is ever used to resolve a component.';
COMMENT ON COLUMN public.templates.specialty_tags IS 'Empty array means relevant to all specialties. Non-empty narrows relevance for surfacing/filtering; not an access-control mechanism.';
COMMENT ON COLUMN public.templates.archetype IS 'Groups templates by shared visual structure (e.g. hero-photo, split-hero, bold-statement) for catalog organization. Free text, not CHECK-constrained: the archetype taxonomy is expected to solidify alongside actual template content in a later step, not be fixed ahead of it.';
COMMENT ON COLUMN public.templates.premium IS 'Gates generation behind a paid plan, matching the existing useIsPro()/PAID_PLANS pattern (src/lib/use-subscription.ts, src/lib/constants.ts) -- browsing remains available regardless of this flag, consistent with the existing Template workflow''s own browse-free/generate-gated behavior.';
COMMENT ON COLUMN public.templates.schema_version IS 'Bumped only if a row''s catalog-metadata shape changes in a way existing readers must account for. Not a rendering/layout version -- layout stays in code and is versioned by the code itself.';

-- ----------------------------------------------------------------
-- template_favorites: simple per-user favorite. Composite primary key (not a
-- surrogate id + separate UNIQUE index) enforces one favorite row per
-- (user, template) pair directly.
-- ----------------------------------------------------------------

CREATE TABLE public.template_favorites (
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id uuid        NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_id)
);

CREATE INDEX idx_template_favorites_user ON public.template_favorites (user_id);

ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_favorites_owner_all"
  ON public.template_favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "template_favorites_admin_read"
  ON public.template_favorites FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE public.template_favorites IS 'Per-user favorited templates. template_id cascades on delete -- if a template row is ever hard-deleted, its favorite rows go with it rather than becoming orphaned.';

-- ----------------------------------------------------------------
-- content_generations.template_id: links a generation back to the catalog
-- entry it started from. Nullable and purely additive -- every existing row,
-- and every future generation created via the existing brief-first flow with
-- no catalog template involved, is completely unaffected.
--
-- Distinct from content_generations.customization->>'frameId' (migration
-- 009): frameId is the actual render choice for one specific post (can
-- diverge from the catalog template if the user switches frames mid-edit);
-- template_id is which catalog row the generation started from, for
-- favoriting/usage/recommendation purposes. Both are allowed to disagree.
-- ----------------------------------------------------------------

ALTER TABLE public.content_generations
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL;

CREATE INDEX idx_content_gen_template_id
  ON public.content_generations (template_id)
  WHERE template_id IS NOT NULL;

COMMENT ON COLUMN public.content_generations.template_id IS 'Which templates catalog row this generation started from, if any. Nullable -- null for generations created via the existing brief-first flow with no catalog template selected. ON DELETE SET NULL so retiring or removing a template never deletes or breaks a user''s already-generated content.';
