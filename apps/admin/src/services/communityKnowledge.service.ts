import api, { extractApiData } from '../lib/api';

export interface CommunityTopic {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  position: number;
  postCount: number;
}

export interface CommunityPostAuthor {
  id: string;
  displayName: string;
  avatar?: string;
  role?: string;
}

export interface CommunityPostItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  tags: string[];
  language: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'DELETED';
  rejectionReason?: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  shareCount: number;
  saveCount: number;
  viewCount: number;
  qualityScore: number;
  isTrainingEligible: boolean;
  trainingStatus?: string;
  createdAt: string;
  updatedAt: string;
  author: CommunityPostAuthor;
  topic?: CommunityTopic | null;
  userReaction?: 'LIKE' | 'DISLIKE' | null;
  isSaved?: boolean;
}

export interface CommunityCommentItem {
  id: string;
  postId: string;
  parentId?: string | null;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  author: CommunityPostAuthor;
  userReaction?: 'LIKE' | 'DISLIKE' | null;
}

export interface CommunityFeedQuery {
  cursor?: string;
  limit?: number;
  topicId?: string;
  tag?: string;
  search?: string;
  sortBy?: 'latest' | 'popular' | 'trending' | 'most_discussed' | 'most_saved' | 'oldest';
  language?: string;
  authorId?: string;
}

export const communityKnowledgeService = {
  // Topics
  async getTopics(): Promise<CommunityTopic[]> {
    const res = await api.get('/community/topics');
    return extractApiData<CommunityTopic[]>(res, []);
  },

  // Feed & Posts
  async getFeed(query: CommunityFeedQuery = {}): Promise<{
    items: CommunityPostItem[];
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  }> {
    const res = await api.get('/community/posts', { params: query });
    const data = extractApiData<any>(res, { items: [], nextCursor: null, hasMore: false, limit: 20 });
    return {
      items: data.items || [],
      nextCursor: data.nextCursor || null,
      hasMore: !!data.hasMore,
      limit: data.limit || 20,
    };
  },

  async getPostById(id: string): Promise<CommunityPostItem> {
    const res = await api.get(`/community/posts/${id}`);
    return extractApiData<CommunityPostItem>(res, res as any);
  },

  async createPost(data: {
    title: string;
    content: string;
    topicId?: string;
    tags?: string[];
    language?: string;
    isDraft?: boolean;
  }): Promise<CommunityPostItem> {
    const res = await api.post('/community/posts', data);
    return extractApiData<CommunityPostItem>(res, res as any);
  },

  async updatePost(
    id: string,
    data: {
      title?: string;
      content?: string;
      topicId?: string;
      tags?: string[];
      language?: string;
    },
  ): Promise<CommunityPostItem> {
    const res = await api.patch(`/community/posts/${id}`, data);
    return extractApiData<CommunityPostItem>(res, res as any);
  },

  async submitDraft(id: string): Promise<CommunityPostItem> {
    const res = await api.post(`/community/posts/${id}/submit`);
    return extractApiData<CommunityPostItem>(res, res as any);
  },

  async deletePost(id: string): Promise<void> {
    await api.delete(`/community/posts/${id}`);
  },

  // Reactions (Atomic LIKE / DISLIKE / NONE)
  async handleReaction(
    postId: string,
    type: 'LIKE' | 'DISLIKE' | 'NONE',
  ): Promise<{
    success: boolean;
    userReaction: 'LIKE' | 'DISLIKE' | null;
    likeCount: number;
    dislikeCount: number;
  }> {
    const res = await api.post(`/community/posts/${postId}/reaction`, { type });
    return extractApiData(res, { success: true, userReaction: type === 'NONE' ? null : type, likeCount: 0, dislikeCount: 0 });
  },

  // Saves / Bookmarks
  async toggleSave(postId: string, save: boolean): Promise<{ isSaved: boolean; saveCount: number }> {
    if (save) {
      const res = await api.post(`/community/posts/${postId}/save`);
      return extractApiData(res, { isSaved: true, saveCount: 1 });
    } else {
      const res = await api.delete(`/community/posts/${postId}/save`);
      return extractApiData(res, { isSaved: false, saveCount: 0 });
    }
  },

  // Share Tracking
  async trackShare(postId: string, platform: string = 'LINK'): Promise<void> {
    await api.post(`/community/posts/${postId}/share`, { platform });
  },

  // Comments & Replies
  async getComments(
    postId: string,
    query: { cursor?: string; limit?: number; parentId?: string } = {},
  ): Promise<{
    items: CommunityCommentItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const res = await api.get(`/community/posts/${postId}/comments`, { params: query });
    const data = extractApiData<any>(res, { items: [], nextCursor: null, hasMore: false });
    return {
      items: data.items || [],
      nextCursor: data.nextCursor || null,
      hasMore: !!data.hasMore,
    };
  },

  async getReplies(
    commentId: string,
    query: { cursor?: string; limit?: number } = {},
  ): Promise<{
    items: CommunityCommentItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const res = await api.get(`/community/comments/${commentId}/replies`, { params: query });
    const data = extractApiData<any>(res, { items: [], nextCursor: null, hasMore: false });
    return {
      items: data.items || [],
      nextCursor: data.nextCursor || null,
      hasMore: !!data.hasMore,
    };
  },

  async createComment(
    postId: string,
    data: { content: string; parentId?: string },
  ): Promise<CommunityCommentItem> {
    const res = await api.post(`/community/posts/${postId}/comments`, data);
    return extractApiData<CommunityCommentItem>(res, res as any);
  },

  async updateComment(commentId: string, content: string): Promise<CommunityCommentItem> {
    const res = await api.patch(`/community/comments/${commentId}`, { content });
    return extractApiData<CommunityCommentItem>(res, res as any);
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/community/comments/${commentId}`);
  },

  // User Post Collections
  async getMyPosts(status?: string, cursor?: string, limit = 20): Promise<{
    items: CommunityPostItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const res = await api.get('/community/my-posts', {
      params: { ...(status ? { status } : {}), cursor, limit },
    });
    const data = extractApiData<any>(res, { items: [], nextCursor: null, hasMore: false });
    return {
      items: data.items || [],
      nextCursor: data.nextCursor || null,
      hasMore: !!data.hasMore,
    };
  },

  async getSavedPosts(cursor?: string, limit = 20): Promise<{
    items: CommunityPostItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const res = await api.get('/community/saved-posts', {
      params: { cursor, limit },
    });
    const data = extractApiData<any>(res, { items: [], nextCursor: null, hasMore: false });
    return {
      items: data.items || [],
      nextCursor: data.nextCursor || null,
      hasMore: !!data.hasMore,
    };
  },

  // Admin Moderation & Training Foundation
  async getAdminPosts(query: {
    status?: string;
    search?: string;
    topicId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{
    items: CommunityPostItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const res = await api.get('/community/admin/posts', { params: query });
    const data = extractApiData<any>(res, { items: [], nextCursor: null, hasMore: false });
    return {
      items: data.items || [],
      nextCursor: data.nextCursor || null,
      hasMore: !!data.hasMore,
    };
  },

  async getPendingCount(): Promise<{ pendingCount: number }> {
    const res = await api.get('/community/admin/pending-count');
    return extractApiData(res, { pendingCount: 0 });
  },

  async approvePost(id: string): Promise<CommunityPostItem> {
    const res = await api.post(`/community/admin/posts/${id}/approve`);
    return extractApiData<CommunityPostItem>(res, res as any);
  },

  async rejectPost(id: string, reason: string): Promise<CommunityPostItem> {
    const res = await api.post(`/community/admin/posts/${id}/reject`, { reason });
    return extractApiData<CommunityPostItem>(res, res as any);
  },

  async archivePost(id: string): Promise<CommunityPostItem> {
    const res = await api.post(`/community/admin/posts/${id}/archive`);
    return extractApiData<CommunityPostItem>(res, res as any);
  },

  async updateTrainingStatus(
    id: string,
    data: { isTrainingEligible: boolean; trainingStatus?: string; qualityScore?: number },
  ): Promise<any> {
    const res = await api.patch(`/community/admin/posts/${id}/training-status`, data);
    return extractApiData(res, res);
  },

  async exportTrainingData(options: {
    topicId?: string;
    language?: string;
    minQualityScore?: number;
    limit?: number;
  }): Promise<void> {
    const params = new URLSearchParams();
    if (options.topicId) params.append('topicId', options.topicId);
    if (options.language) params.append('language', options.language);
    if (options.minQualityScore !== undefined) params.append('minQualityScore', String(options.minQualityScore));
    if (options.limit !== undefined) params.append('limit', String(options.limit));

    const token = localStorage.getItem('vocabflow_access_token');
    const response = await fetch(`/api/v1/community/admin/training-data/export?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leximind_training_dataset_${new Date().toISOString().slice(0, 10)}.jsonl`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
