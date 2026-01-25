"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface SearchResult {
  id: string;
  title: string;
  category: "course" | "instructor" | "topic";
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
}

// Mock data for search suggestions
const MOCK_DATA = {
  courses: [
    {
      id: "CS-101",
      title: "Advanced UI/UX Masterclass for Digital Products",
      category: "course" as const,
      instructor: "Dr. Sarah Connor",
      rating: 4.9,
      price: 84.99,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCil99ZvcYdOTX2ikzfmezXpX8PM1gdqvlH9POOIWtf_oLnLUykcTbi_AmwTRyHd91SesbJSqYVeMRowIU8LwxAMfmlo6f_Pz1u8SrLX6MRh78Y4jM36RyPsfr3f6KzeGWxm4kZXTGblOlSET-GxfYpd_Nzdu1P0AVyTV6bpa_jwzSu1ZfKYb7SrSNphUJwOZowmvViRp-dqkbRQYrkWbuITbMKEf_FdUEefC39x97j6p9fuc1eF7A1Z3QFUZVecRUTOyGnzRBp9_Q",
    },
    {
      id: "MK-204",
      title: "Data-Driven Growth Strategies for Startups",
      category: "course" as const,
      instructor: "James Wilson",
      rating: 4.7,
      price: 49.99,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAvzbzuSjw86VeI3OOXElSHJGSEvvzouGyeAW34jd3Px-Io4QsMww1pfJW7UOrjmNJJJ_DaLMU81Np88h_XCXTqDiDlcl9mNDYwjXXpxgNJJDTWfwEiAukRqT_aWTm9KNnK-6hjRAZZ1EPYs-Sz8NXTSel_BwuZekfnzd5n0JxMSoI2ke-DWJeJv42Df58VwTZCOadgRyZ6ktv0syTD-xYuIuPk4fe0vYDgPEqVPNAigyQsq3AxWqvfnpntYxcLt3ABxf7aaTSb1cQ",
    },
    {
      id: "GD-009",
      title: "Professional Branding: From Concept to Launch",
      category: "course" as const,
      instructor: "Dr. Sarah Connor",
      rating: 4.5,
      price: 119.0,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCreAkOdseX9ZVH36oFGC3i0Q7D-DQz4x3zJL5NDtMSwfta8Qw886FBxG-IqaeUipdJkrptvGNhoKABpUsxpWM3mdOIUqxuJd_fIs7rU40m72S62pZ5kpdbKsqlJVJyqsi2WWJEkXEWJbKJwxP8BauVhNPiCvvFftKmHNbg7YM1sd5mq65ce7SyfNYQF70fI6FtiiqDZsVImVhLv0vn7St75HI9mz129PyeaPssxNqC7teU9A8by_hsz-wROUBDqIZLBErccnO0oQ",
    },
    {
      id: "WD-300",
      title: "Modern Web Design with Figma and Webflow",
      category: "course" as const,
      instructor: "Dr. Sarah Connor",
      rating: 4.6,
      price: 99.0,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAC6NhUUHDRqyDaSzJlgNygr56BoDO_8fQcX3et2Wnp8VDx35N3nXgqbR-Xt6LuiN8hBJJaqe85edLCUHF5Bfgu7Px9PPIjEpbNqBu_b_BBAFHrqEGmReNkqR478aid53gP2dmZgNyG55_bI7DNrVWMgb85BYuA7qVKC-a25Qn5MboAwsL8FmgvO-VnOtPKgxx-yRNmHY4bAzrF8d9nAusUx1x_WpNRHMsGsuZkOktb-WhkFhppcyDN489FP793xIA_CTxtWMSe0r4",
    },
    {
      id: "SM-881",
      title: "Social Media Marketing: Zero to Hero",
      category: "course" as const,
      instructor: "James Wilson",
      rating: 4.9,
      price: 24.99,
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAUd6QuR7Rp0azAg6bhUKGrn8eqsVDX9Ry8ezok66U35Rnc39EGF8e_4RTwbxJKMv-73ahqf8f5ZB9b93NmWiNPSK8EnFcIr6DteWxx7yWzlyXRTn5Ti-5vmkE6VCeszMwgLEntCvZqhhTZrqr2Jn9RHsXJsFVCynv4RsUCpiG3B-L_NPzkyO3IFkYBfoMOmsHnLUsFI4SXKQGRME81AAq--3NMDs_chLm5cXIc-AdEeXiMFUIGBH9GllgnintdJWon-xXTl_1BWos",
    },
  ],
  instructors: [
    {
      id: "INST-001",
      title: "Dr. Sarah Connor",
      category: "instructor" as const,
      image: "https://ui-avatars.com/api/?name=Sarah+Connor",
      description: "Expert in UI/UX Design and Web Development",
    },
    {
      id: "INST-002",
      title: "James Wilson",
      category: "instructor" as const,
      image: "https://ui-avatars.com/api/?name=James+Wilson",
      description: "Marketing and Growth Strategy Specialist",
    },
  ],
  topics: [
    {
      id: "TOPIC-001",
      title: "UI/UX Design",
      category: "topic" as const,
      description: "Learn user interface and user experience design",
    },
    {
      id: "TOPIC-002",
      title: "Digital Marketing",
      category: "topic" as const,
      description: "Master digital marketing strategies",
    },
    {
      id: "TOPIC-003",
      title: "Web Development",
      category: "topic" as const,
      description: "Build modern web applications",
    },
    {
      id: "TOPIC-004",
      title: "Data Analysis",
      category: "topic" as const,
      description: "Analyze and visualize data effectively",
    },
  ],
};

export const useSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CategorizedResults>({
    courses: [],
    instructors: [],
    topics: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory");
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading search history:", e);
      }
    }
  }, []);

  // Perform search
  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setIsLoading(true);

    // Simulate API delay
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setResults({ courses: [], instructors: [], topics: [] });
        setIsLoading(false);
        return;
      }

      const lowerQuery = searchQuery.toLowerCase();

      // Filter results from mock data
      const filteredCourses = MOCK_DATA.courses.filter(
        (course) =>
          course.title.toLowerCase().includes(lowerQuery) ||
          course.instructor?.toLowerCase().includes(lowerQuery),
      );

      const filteredInstructors = MOCK_DATA.instructors.filter((instructor) =>
        instructor.title.toLowerCase().includes(lowerQuery),
      );

      const filteredTopics = MOCK_DATA.topics.filter(
        (topic) =>
          topic.title.toLowerCase().includes(lowerQuery) ||
          topic.description?.toLowerCase().includes(lowerQuery),
      );

      setResults({
        courses: filteredCourses.slice(0, 3),
        instructors: filteredInstructors.slice(0, 3),
        topics: filteredTopics.slice(0, 3),
      });

      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Add to search history
  const addToHistory = useCallback(
    (term: string) => {
      if (!term.trim()) return;

      const updated = [
        term,
        ...searchHistory.filter((item) => item !== term),
      ].slice(0, 5);

      setSearchHistory(updated);
      localStorage.setItem("searchHistory", JSON.stringify(updated));
    },
    [searchHistory],
  );

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
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
