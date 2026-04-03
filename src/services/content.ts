import { supabase } from '../lib/supabase';

// Helper para manejar errores de Supabase graciosamente
const safe = async <T>(fn: () => Promise<T>): Promise<T> => {
  try { return await fn(); }
  catch { return { data: null, error: new Error('DB unavailable') } as any; }
};

// ─── BLOGS ───────────────────────────────────────────────────────────────────

export const getBlogs = (limit = 10, offset = 0) => safe(() =>
  supabase.from('blogs').select('*, categories(name, slug)')
    .eq('status', 'published').order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)
);

export const getBlogBySlug = (slug: string) => safe(() =>
  supabase.from('blogs').select('*, categories(name, slug)')
    .eq('slug', slug).eq('status', 'published').single()
);

export const getAllBlogsAdmin = () => safe(() =>
  supabase.from('blogs').select('*, categories(name)').order('created_at', { ascending: false })
);

export async function upsertBlog(blog: any) {
  if (blog.id) return supabase.from('blogs').update(blog).eq('id', blog.id);
  return supabase.from('blogs').insert(blog);
}

export const deleteBlog = (id: number) => supabase.from('blogs').delete().eq('id', id);

// ─── NEWS ────────────────────────────────────────────────────────────────────

export const getNews = (limit = 10, offset = 0) => safe(() =>
  supabase.from('news').select('*').not('published_at', 'is', null)
    .order('published_at', { ascending: false }).range(offset, offset + limit - 1)
);

export const getFeaturedNews = (limit = 3) => safe(() =>
  supabase.from('news').select('*').eq('featured', true)
    .not('published_at', 'is', null).order('published_at', { ascending: false }).limit(limit)
);

export const getNewsBySlug = (slug: string) => safe(() =>
  supabase.from('news').select('*').eq('slug', slug).not('published_at', 'is', null).single()
);

export async function upsertNews(news: any) {
  if (news.id) return supabase.from('news').update(news).eq('id', news.id);
  return supabase.from('news').insert(news);
}

export const deleteNews = (id: number) => supabase.from('news').delete().eq('id', id);

// ─── GALLERIES ───────────────────────────────────────────────────────────────

export const getGalleries = () => safe(() =>
  supabase.from('galleries').select('*, photos(count)').order('created_at', { ascending: false })
);

export const getGalleryBySlug = (slug: string) => safe(() =>
  supabase.from('galleries').select('*, photos(*)').eq('slug', slug).single()
);

export async function upsertGallery(gallery: any) {
  if (gallery.id) return supabase.from('galleries').update(gallery).eq('id', gallery.id);
  return supabase.from('galleries').insert(gallery);
}

export const deleteGallery = (id: number) => supabase.from('galleries').delete().eq('id', id);
export const addPhoto = (photo: any) => supabase.from('photos').insert(photo);
export const deletePhoto = (id: number) => supabase.from('photos').delete().eq('id', id);

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export const getUpcomingEvents = (limit = 5) => safe(() => {
  const today = new Date().toISOString().split('T')[0];
  return supabase.from('events').select('*').gte('event_date', today)
    .eq('status', 'upcoming').order('event_date', { ascending: true }).limit(limit);
});

export const getAllEvents = () => safe(() =>
  supabase.from('events').select('*').order('event_date', { ascending: false })
);

export const getEventBySlug = (slug: string) => safe(() =>
  supabase.from('events').select('*').eq('slug', slug).single()
);

export async function upsertEvent(event: any) {
  if (event.id) return supabase.from('events').update(event).eq('id', event.id);
  return supabase.from('events').insert(event);
}

export const deleteEvent = (id: number) => supabase.from('events').delete().eq('id', id);

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────

export const getDocuments = (type?: string) => safe(() => {
  let query = supabase.from('documents').select('*').order('published_at', { ascending: false });
  if (type) query = query.eq('type', type);
  return query;
});

export async function upsertDocument(doc: any) {
  if (doc.id) return supabase.from('documents').update(doc).eq('id', doc.id);
  return supabase.from('documents').insert(doc);
}

export const deleteDocument = (id: number) => supabase.from('documents').delete().eq('id', id);

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export const createMessage = (msg: any) => supabase.from('messages').insert(msg);

export const getMessages = () => safe(() =>
  supabase.from('messages').select('*').order('created_at', { ascending: false })
);

export const markMessageRead = (id: number) =>
  supabase.from('messages').update({ is_read: true }).eq('id', id);

export const deleteMessage = (id: number) => supabase.from('messages').delete().eq('id', id);

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  try {
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
      blogs: blogs.count ?? 0, news: news.count ?? 0,
      galleries: galleries.count ?? 0, photos: photos.count ?? 0,
      events: events.count ?? 0, documents: documents.count ?? 0,
      unreadMessages: messages.count ?? 0,
    };
  } catch {
    return { blogs: 0, news: 0, galleries: 0, photos: 0, events: 0, documents: 0, unreadMessages: 0 };
  }
}
