import api, { extractApiData, extractApiList } from '../lib/api';

export interface NoteCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  position: number;
  isArchived: boolean;
  noteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  plainTextPreview?: string;
  content?: string;
  categoryId?: string | null;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  } | null;
}

export interface NotesOverviewCount {
  totalNotes: number;
  activeNotes: number;
  archivedNotes: number;
  categoriesCount: number;
}

export interface NoteQueryOptions {
  cursor?: string;
  limit?: number;
  categoryId?: string;
  search?: string;
  isArchived?: boolean;
  isPinned?: boolean;
  tag?: string;
  sortBy?: 'latest' | 'oldest' | 'updated' | 'title';
}

export const notesService = {
  // Categories
  async getCategories(): Promise<NoteCategory[]> {
    const res = await api.get('/note-categories');
    return extractApiData<NoteCategory[]>(res, []);
  },

  async createCategory(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    position?: number;
  }): Promise<NoteCategory> {
    const res = await api.post('/note-categories', data);
    return extractApiData<NoteCategory>(res, res as any);
  },

  async updateCategory(
    id: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      position?: number;
      isArchived?: boolean;
    },
  ): Promise<NoteCategory> {
    const res = await api.patch(`/note-categories/${id}`, data);
    return extractApiData<NoteCategory>(res, res as any);
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/note-categories/${id}`);
  },

  async reorderCategories(orderedIds: string[]): Promise<void> {
    await api.patch('/note-categories/reorder', { orderedIds });
  },

  // Notes
  async getNotes(query: NoteQueryOptions = {}): Promise<{
    items: NoteItem[];
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  }> {
    const res = await api.get('/notes', { params: query });
    const data = extractApiData<any>(res, { items: [], nextCursor: null, hasMore: false, limit: 30 });
    return {
      items: data.items || [],
      nextCursor: data.nextCursor || null,
      hasMore: !!data.hasMore,
      limit: data.limit || 30,
    };
  },

  async getNoteById(id: string): Promise<NoteItem> {
    const res = await api.get(`/notes/${id}`);
    return extractApiData<NoteItem>(res, res as any);
  },

  async createNote(data: {
    title: string;
    content: string;
    categoryId?: string;
    tags?: string[];
    isPinned?: boolean;
  }): Promise<NoteItem> {
    const res = await api.post('/notes', data);
    return extractApiData<NoteItem>(res, res as any);
  },

  async updateNote(
    id: string,
    data: {
      title?: string;
      content?: string;
      categoryId?: string;
      tags?: string[];
      isPinned?: boolean;
      isArchived?: boolean;
    },
  ): Promise<NoteItem> {
    const res = await api.patch(`/notes/${id}`, data);
    return extractApiData<NoteItem>(res, res as any);
  },

  async deleteNote(id: string): Promise<void> {
    await api.delete(`/notes/${id}`);
  },

  async restoreNote(id: string): Promise<NoteItem> {
    const res = await api.post(`/notes/${id}/restore`);
    return extractApiData<NoteItem>(res, res as any);
  },

  async getNotesCount(): Promise<NotesOverviewCount> {
    const res = await api.get('/notes/count');
    return extractApiData<NotesOverviewCount>(res, {
      totalNotes: 0,
      activeNotes: 0,
      archivedNotes: 0,
      categoriesCount: 0,
    });
  },
};
