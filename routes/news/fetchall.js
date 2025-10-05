'use client';

import { useState, useCallback } from 'react';
import { useClientSession } from './ClientSessions';

interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  featured: boolean;
  image_url: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'high' | 'medium' | 'short';
  tags: string;
  reading_time: number;
  views: number;
  likes_count: number;
  comments_count: number;
  first_name: string;
  last_name: string;
  author_id: number;
  published_at: string;
  created_at: string;
  youtube_url: string;
  is_breaking?: boolean;
}

interface PaginatedResponse {
  news: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const FetchAll = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { csrfToken } = useClientSession();

  const API_BASE = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NODE_ENV === 'production' 
      ? 'https://vybeztribe.com' 
      : 'http://localhost:3000';

  const searchNews = useCallback(async (
    query: string,
    filters: any = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse> => {
    if (!query.trim()) {
      return { news: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }

    try {
      setIsSearching(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/news?search=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        }
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      return {
        news: data.news || [],
        pagination: {
          page: data.pagination?.current_page || page,
          limit: data.pagination?.per_page || limit,
          total: data.pagination?.total_news || 0,
          totalPages: data.pagination?.total_pages || 0,
          hasNext: data.pagination?.has_next || false,
          hasPrev: data.pagination?.has_prev || false
        }
      };
    } catch (error) {
      setError('Search failed');
      return { news: [], pagination: { page: 1, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    } finally {
      setIsSearching(false);
    }
  }, [API_BASE, csrfToken]);

  const fetchByCategory = useCallback(async (
    categorySlug: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/news?category_slug=${categorySlug}&page=${page}&limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        }
      });

      if (!response.ok) {
        throw new Error('Category fetch failed');
      }

      const data = await response.json();
      return {
        news: data.news || [],
        pagination: {
          page: data.pagination?.current_page || page,
          limit: data.pagination?.per_page || limit,
          total: data.pagination?.total_news || 0,
          totalPages: data.pagination?.total_pages || 0,
          hasNext: data.pagination?.has_next || false,
          hasPrev: data.pagination?.has_prev || false
        }
      };
    } catch (error) {
      setError('Category fetch failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, csrfToken]);

  const fetchGalleryNews = useCallback(async (
    category: string = 'all',
    page: number = 1,
    limit: number = 24
  ): Promise<PaginatedResponse> => {
    try {
      const response = await fetch(`${API_BASE}/api/news?gallery=true&category=${category}&page=${page}&limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        }
      });

      if (!response.ok) {
        throw new Error('Gallery fetch failed');
      }

      const data = await response.json();
      return {
        news: data.gallery_news || [],
        pagination: {
          page: page,
          limit: limit,
          total: data.total || 0,
          totalPages: Math.ceil((data.total || 0) / limit),
          hasNext: (data.total || 0) > (page * limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }, [API_BASE, csrfToken]);

  const trackView = useCallback(async (newsId: number) => {
    try {
      await fetch(`${API_BASE}/api/news/${newsId}/view`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.warn('View tracking failed');
    }
  }, [API_BASE]);

  const getSuggestions = useCallback(async (query: string): Promise<string[]> => {
    if (query.length < 2) return [];

    try {
      const response = await fetch(`${API_BASE}/api/news?search=${encodeURIComponent(query)}&limit=5`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.news?.slice(0, 5).map((item: any) => item.title) || [];
    } catch (error) {
      return [];
    }
  }, [API_BASE]);

  return {
    isLoading,
    isSearching,
    error,
    searchNews,
    fetchByCategory,
    fetchGalleryNews,
    trackView,
    getSuggestions
  };
};

export default FetchAll;
export type { NewsItem, PaginatedResponse };