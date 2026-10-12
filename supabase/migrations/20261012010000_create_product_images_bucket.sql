insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public can read product images"
  on storage.objects for select
  to anon
  using (bucket_id = 'product-images');
