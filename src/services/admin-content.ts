import { createServerClient } from '../lib/supabase';

function adminSupabase() {
  return createServerClient();
}

export async function getAdminDashboardStats() {
  const supabase = adminSupabase();

  const [blogs, news, galleries, photos, events, documents, messages] = await Promise.all([
    supabase.from('blogs').select('id', { count: 'exact', head: true }),
    supabase.from('news').select('id', { count: 'exact', head: true }),
    supabase.from('galleries').select('id', { count: 'exact', head: true }),
    supabase.from('photos').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('documents').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
  ]);

  return {
    blogs: blogs.count ?? 0,
    news: news.count ?? 0,
    galleries: galleries.count ?? 0,
    photos: photos.count ?? 0,
    events: events.count ?? 0,
    documents: documents.count ?? 0,
    unreadMessages: messages.count ?? 0,
  };
}

export async function getAdminBlogs(options: { search?: string, status?: string, category?: string, limit?: number, offset?: number } = {}) {
  let query = adminSupabase()
    .from('blogs')
    .select('*, categories(name)', { count: 'exact' });

  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.category) {
    query = query.eq('category_id', options.category);
  }
  if (options.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return { data: data ?? [], total: count ?? 0 };
}

export async function getBlogCategories() {
  const { data, error } = await adminSupabase()
    .from('categories')
    .select('*')
    .eq('type', 'blog')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getAdminBlogById(id: string) {
  const supabase = adminSupabase();
  const [{ data: blog, error: blogError }, { data: categories, error: categoriesError }] = await Promise.all([
    supabase.from('blogs').select('*, categories(id,name)').eq('id', id).single(),
    supabase.from('categories').select('*').eq('type', 'blog').order('name', { ascending: true }),
  ]);

  if (blogError) {
    throw blogError;
  }

  if (categoriesError) {
    throw categoriesError;
  }

  return {
    blog,
    categories: categories ?? [],
  };
}

export async function getAdminNews(options: { search?: string, type?: string, limit?: number, offset?: number } = {}) {
  let query = adminSupabase()
    .from('news')
    .select('*', { count: 'exact' });

  if (options.type) {
    query = query.eq('type', options.type);
  }
  if (options.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return { data: data ?? [], total: count ?? 0 };
}

export async function getAdminNewsById(id: string) {
  const { data, error } = await adminSupabase()
    .from('news')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAdminMessages() {
  const { data, error } = await adminSupabase()
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listAllStorageAssets(buckets: string[]) {
  const supabase = adminSupabase();
  const results = await Promise.all(buckets.map(async (bucket) => {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'desc' },
    });
    if (error) return [];
    return data.map(file => ({
      ...file,
      bucket,
      url: supabase.storage.from(bucket).getPublicUrl(file.name).data.publicUrl
    }));
  }));

  return results.flat().sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}
