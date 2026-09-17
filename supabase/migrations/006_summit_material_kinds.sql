-- Summit Graphics: EXAMPLE master templates for dies, tools, and other.
-- Additive. Does not invent plant rates. Seed values stay EXAMPLE stubs.

alter type public.material_kind add value if not exists 'die';
alter type public.material_kind add value if not exists 'tool';
alter type public.material_kind add value if not exists 'other';
