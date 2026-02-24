import { supabase } from './supabase';

// ---- BOOKS ----

// Find or create a book from Open Library data
export async function findOrCreateBook(olBook) {
  // Check if book already exists by ol_key
  if (olBook.ol_key) {
    const { data: existing } = await supabase
      .from('books')
      .select('*')
      .eq('ol_key', olBook.ol_key)
      .single();
    if (existing) return existing;
  }

  // Create new book
  const { data, error } = await supabase
    .from('books')
    .insert({
      title: olBook.title,
      author: olBook.author,
      isbn: olBook.isbn || null,
      pages: olBook.pages || null,
      pub_date: olBook.year ? String(olBook.year) : null,
      genres: [],
      subjects: olBook.subjects || [],
      cover_emoji: null,
      ol_key: olBook.ol_key || null,
      summary: olBook.description || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getBook(bookId) {
  const { data } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();
  return data;
}

// ---- SHELVES ----

export async function getUserShelves(userId) {
  const { data } = await supabase
    .from('shelves')
    .select('*, books(*)')
    .eq('user_id', userId)
    .order('date_added', { ascending: false });
  return data || [];
}

export async function addToShelf(userId, bookId, shelf) {
  const { data, error } = await supabase
    .from('shelves')
    .upsert({
      user_id: userId,
      book_id: bookId,
      shelf,
      date_added: new Date().toISOString(),
      date_finished: shelf === 'read' ? new Date().toISOString() : null,
    }, { onConflict: 'user_id,book_id' })
    .select()
    .single();
  if (error) throw error;

  // Log activity
  await supabase.from('activities').insert({
    user_id: userId,
    type: 'shelved',
    book_id: bookId,
    shelf,
  }).catch(() => {}); // Don't fail if activity logging fails

  return data;
}

export async function removeFromShelf(userId, bookId) {
  const { error } = await supabase
    .from('shelves')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);
  if (error) throw error;
}

export async function rateBook(userId, bookId, rating) {
  const { data, error } = await supabase
    .from('shelves')
    .update({ rating })
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- REC SETS ----

export async function createRecSet(userId, sourceBookId, review, rating, note, recs) {
  // Create the rec set
  const { data: recSet, error: rsError } = await supabase
    .from('rec_sets')
    .insert({
      user_id: userId,
      source_book_id: sourceBookId,
      review,
      rating,
      note,
    })
    .select()
    .single();
  
  if (rsError) throw rsError;

  // Insert the 3 recs
  const recInserts = recs.map((rec, i) => ({
    rec_set_id: recSet.id,
    book_id: rec.bookId,
    position: i + 1,
    tags: rec.tags || [],
  }));

  const { error: recError } = await supabase
    .from('recs')
    .insert(recInserts);
  
  if (recError) throw recError;
  return recSet;
}

export async function getFeed(userId, limit = 20) {
  // Get rec sets from people the user follows, plus their own
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  
  const followIds = (following || []).map(f => f.following_id);
  followIds.push(userId); // Include own posts

  const { data } = await supabase
    .from('rec_sets')
    .select(`
      *,
      profiles:user_id(*),
      source_book:source_book_id(*),
      recs(*, books:book_id(*))
    `)
    .in('user_id', followIds)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return data || [];
}

export async function getExploreFeed(limit = 20) {
  // Get all rec sets for discovery
  const { data } = await supabase
    .from('rec_sets')
    .select(`
      *,
      profiles:user_id(*),
      source_book:source_book_id(*),
      recs(*, books:book_id(*))
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return data || [];
}

export async function getUserRecSets(userId) {
  const { data } = await supabase
    .from('rec_sets')
    .select(`
      *,
      source_book:source_book_id(*),
      recs(*, books:book_id(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ---- FOLLOWS ----

export async function followUser(followerId, followingId) {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  if (error && error.code !== '23505') throw error; // ignore duplicate
}

export async function unfollowUser(followerId, followingId) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}

export async function getFollowers(userId) {
  const { data } = await supabase
    .from('follows')
    .select('follower_id, profiles:follower_id(*)')
    .eq('following_id', userId);
  return data || [];
}

export async function getFollowing(userId) {
  const { data } = await supabase
    .from('follows')
    .select('following_id, profiles:following_id(*)')
    .eq('follower_id', userId);
  return data || [];
}

export async function isFollowing(followerId, followingId) {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single();
  return !!data;
}

// ---- LIKES ----

export async function toggleLike(userId, recSetId) {
  const { data: existing } = await supabase
    .from('rec_set_likes')
    .select('*')
    .eq('user_id', userId)
    .eq('rec_set_id', recSetId)
    .single();

  if (existing) {
    await supabase
      .from('rec_set_likes')
      .delete()
      .eq('user_id', userId)
      .eq('rec_set_id', recSetId);
    return false;
  } else {
    await supabase
      .from('rec_set_likes')
      .insert({ user_id: userId, rec_set_id: recSetId });
    return true;
  }
}

export async function getLikeCount(recSetId) {
  const { count } = await supabase
    .from('rec_set_likes')
    .select('*', { count: 'exact', head: true })
    .eq('rec_set_id', recSetId);
  return count || 0;
}

// ---- PROFILES ----

export async function getProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function searchUsers(query) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .or(`display_name.ilike.%${query}%,handle.ilike.%${query}%`)
    .limit(10);
  return data || [];
}

// ---- ACTIVITIES ----

export async function createActivity(userId, type, bookId, shelf) {
  const { error } = await supabase
    .from('activities')
    .insert({ user_id: userId, type, book_id: bookId, shelf });
  if (error) console.error('Activity error:', error);
}

export async function getActivities(limit = 30) {
  const { data } = await supabase
    .from('activities')
    .select(`
      *,
      profiles:user_id(*),
      books:book_id(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}
