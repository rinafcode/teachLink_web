'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logging';
const logger = createLogger('useSearch');

export interface SearchResult {
  id: string;
  title: string;
  category: 'course' | 'instructor' | 'topic' | 'investment';
  instructor?: string;
  rating?: number;
  price?: number;
  image?: string;
  description?: string;
}

export interface CategorizedResults {
  courses: SearchResult[];
  instructors: SearchResult[];
  topics: SearchResult[];
  investments: SearchResult[];
}

// Fallback mock data — used only in dev mode when the API is unreachable
// or when NEXT_PUBLIC_USE_MOCK_SEARCH is explicitly set to "true".
const MOCK_DATA: CategorizedResults = {
  courses: [
    { id: 'CS-101', title: 'Advanced UI/UX Masterclass for Digital Products', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.9, price: 84.99, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCil99ZvcYdOTX2ikzfmezXpX8PM1gdqvlH9POOIWtf_oLnLUykcTbi_AmwTRyHd91SesbJSqYVeMRowIU8LwxAMfmlo6f_Pz1u8SrLX6MRh78Y4jM36RyPsfr3f6KzeGWxm4kZXTGblOlSET-GxfYpd_Nzdu1P0AVyTV6bpa_jwzSu1ZfKYb7SrSNphUJwOZowmvViRp-dqkbRQYrkWbuITbMKEf_FdUEefC39x97j6p9fuc1eF7A1Z3QFUZVecRUTOyGnzRBp9_Q' },
    { id: 'MK-204', title: 'Data-Driven Growth Strategies for Startups', category: 'course', instructor: 'James Wilson', rating: 4.7, price: 49.99, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvzbzuSjw86VeI3OOXElSHJGSEvvzouGyeAW34jd3Px-Io4QsMww1pfJW7UOrjmNJJJ_DaLMU81Np88h_XCXTqDiDlcl9mNDYwjXXpxgNJJDTWfwEiAukRqT_aWTm9KNnK-6hjRAZZ1EPYs-Sz8NXTSel_BwuZekfnzd5n0JxMSoI2ke-DWJeJv42Df58VwTZCOadgRyZ6ktv0syTD-xYuIuPk4fe0vYDgPEqVPNAigyQsq3AxWqvfnpntYxcLt3ABxf7aaTSb1cQ' },
    { id: 'GD-009', title: 'Professional Branding: From Concept to Launch', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.5, price: 119.0, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCreAkOdseX9ZVH36oFGC3i0Q7D-DQz4x3zJL5NDtMSwfta8Qw886FBxG-IqaeUipdJkrptvGNhoKABpUsxpWM3mdOIUqxuJd_fIs7rU40m72S62pZ5kpdbKsqlJVJyqsi2WWJEkXEWJbKJwxP8BauVhNPiCvvFftKmHNbg7YM1sd5mq65ce7SyfNYQF70fI6FtiiqDZsVImVhLv0vn7St75HI9mz129PyeaPssxNqC7teU9A8by_hsz-wROUBDqIZLBErccnO0oQ' },
    { id: 'WD-300', title: 'Modern Web Design with Figma and Webflow', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.6, price: 99.0, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC6NhUUHDRqyDaSzJlgNygr56BoDO_8fQcX3et2Wnp8VDx35N3nXgqbR-Xt6LuiN8hBJJaqe85edLCUHF5Bfgu7Px9PPIjEpbNqBu_b_BBAFHrqEGmReNkqR478aid53gP2dmZgNyG55_bI7DNrVWMgb85BYuA7qVKC-a25Qn5MboAwsL8FmgvO-VnOtPKgxx-yRNmHY4bAzrF8d9nAusUx1x_WpNRHMsGsuZkOktb-WhkFhppcyDN489FP793xIA_CTxtWMSe0r4' },
    { id: 'SM-881', title: 'Social Media Marketing: Zero to Hero', category: 'course', instructor: 'James Wilson', rating: 4.9, price: 24.99, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUd6QuR7Rp0azAg6bhUKGrn8eqsVDX9Ry8ezok66U35Rnc39EGF8e_4RTwbxJKMv-73ahqf8f5ZB9b93NmWiNPSK8EnFcIr6DteWxx7yWzlyXRTn5Ti-5vmkE6VCeszMwgLEntCvZqhhTZrqr2Jn9RHsXJsFVCynv4RsUCpiG3B-L_NPzkyO3IFkYBfoMOmsHnLUsFI4SXKQGRME81AAq--3NMDs_chLm5cXIc-AdEeXiMFUIGBH9GllgnintdJWon-xXTl_1BWos' },
  ],
  instructors: [
    { id: 'INST-001', title: 'Dr. Sarah Connor', category: 'instructor', image: 'https://ui-avatars.com/api/?name=Sarah+Connor', description: 'Expert in UI/UX Design and Web Development' },
    { id: 'INST-002', title: 'James Wilson', category: 'instructor', image: 'https://ui-avatars.com/api/?name=James+Wilson', description: 'Marketing and Growth Strategy Specialist' },
  ],
  topics: [
    { id: 'TOPIC-001', title: 'UI/UX Design', category: 'topic', description: 'Learn user interface and user experience design' },
    { id: 'TOPIC-002', title: 'Digital Marketing', category: 'topic', description: 'Master digital marketing strategies' },
    { id: 'TOPIC-003', title: 'Web Development', category: 'topic', description: 'Build modern web applications' },
    { id: 'TOPIC-004', title: 'Data Analysis', category: 'topic', description: 'Analyze and visualize data effectively' },
  ],
  investments: [
    { id: 'INV-101', title: 'Investment Fundamentals for Creators', category: 'investment', description: 'Understand capital allocation, growth opportunities, and risk management.' },
    { id: 'INV-102', title: 'Investment Planning for Startups', category: 'investment', description: 'Learn how to build investor-ready business plans and pitch decks.' },
    { id: 'INV-103', title: 'Strategic Capital Deployment', category: 'investment', description: 'Align project goals with effective investment and sourcing strategies.' },
  ],
};

/**
 * Whether to bypass the API and always use the local mock fallback.
 * Controlled via NEXT_PUBLIC_USE_MOCK_SEARCH env var.
 * Defaults to false — the API is always preferred; the mock is used
 * only when the API request fails or is otherwise unavailable.
 */
const USE_MOCK_FALLBACK =
  process.env.NEXT_PUBLIC_USE_MOCK_SEARCH === 'true';

const DEBOUNCE_MS = 300;
const SEARCH_API_URL = '/api/search';

/**
 * Client-side filter against the mock data — used as a local fallback when the
 * API is unreachable, or when USE_MOCK_FALLBACK is explicitly enabled.
 */
function localFilter(query: string, data: CategorizedResults): CategorizedResults {
  const lower = query.toLowerCase();
  return {
    courses: data.courses
      .filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.instructor?.toLowerCase().includes(lower),
      )
      .slice(0, 3),
    instructors: data.instructors
      .filter((i) => i.title.toLowerCase().includes(lower))
      .slice(0, 3),
    topics: data.topics
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.description?.toLowerCase().includes(lower),
      )
      .slice(0, 3),
    investments: data.investments
      .filter(
        (i) =>
          i.title.toLowerCase().includes(lower) ||
          i.description?.toLowerCase().includes(lower),
      )
      .slice(0, 3),
  };
}

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CategorizedResults>({
    courses: [],
    instructors: [],
    topics: [],
    investments: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const router = useRouter();

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('searchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        logger.error('Error loading search history', { error: e });
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  /**
   * Execute the API-backed search. Called after the debounce window.
   * Aborts any in-flight request if a new keystroke arrives.
   */
  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ courses: [], instructors: [], topics: [], investments: [] });
      setIsLoading(false);
      return;
    }

    // Abort any previous in-flight request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    const { signal } = abortController.current;

    // Short-circuit: use local mock in dev/non-production with env flag
    if (USE_MOCK_FALLBACK) {
      const filtered = localFilter(searchQuery, MOCK_DATA);
      setResults(filtered);
      setIsLoading(false);
      logger.info('Mock fallback used for search', { query: searchQuery });
      return;
    }

    try {
      const params = new URLSearchParams({ q: searchQuery });
      const res = await fetch(`${SEARCH_API_URL}?${params}`, { signal });

      // If the request was aborted, bail out silently
      if (signal.aborted) return;

      if (!res.ok) {
        throw new Error(`Search API returned ${res.status}`);
      }

      const data: CategorizedResults = await res.json();
      // Guard against aborted state after JSON parse
      if (signal.aborted) return;

      setResults(data);
    } catch (err: unknown) {
      // Ignore aborted requests — they are expected on fast typing
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      logger.error('Search API request failed, falling back to mock', {
        error: err instanceof Error ? err.message : String(err),
        query: searchQuery,
      });

      // Fall back to local filtering when the API is unreachable
      const filtered = localFilter(searchQuery, MOCK_DATA);
      setResults(filtered);
    } finally {
      // Only clear loading if this controller is still the active one
      if (abortController.current && !abortController.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced search: set loading immediately, delay execution
  const search = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (!searchQuery.trim()) {
        setIsLoading(false);
        setResults({ courses: [], instructors: [], topics: [], investments: [] });
        return;
      }

      setIsLoading(true);
      debounceTimer.current = setTimeout(() => executeSearch(searchQuery), DEBOUNCE_MS);
    },
    [executeSearch],
  );

  // Add to search history
  const addToHistory = useCallback(
    (term: string) => {
      if (!term.trim()) return;

      const updated = [term, ...searchHistory.filter((item) => item !== term)].slice(0, 5);

      setSearchHistory(updated);
      localStorage.setItem('searchHistory', JSON.stringify(updated));
    },
    [searchHistory],
  );

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  }, []);

  // Navigate to search results page
  const navigate = useCallback(
    (searchTerm: string) => {
      addToHistory(searchTerm);
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      setIsOpen(false);
    },
    [router, addToHistory],
  );

  return {
    query,
    results,
    isLoading,
    searchHistory,
    isOpen,
    setIsOpen,
    search,
    clearHistory,
    navigate,
    addToHistory,
  };
};
