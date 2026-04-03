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

export async function getAdminBlogs() {
  const { data, error } = await adminSupabase()
    .from('blogs')
    .select('*, categories(name)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
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

export async function getAdminNews() {
  const { data, error } = await adminSupabase()
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
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
