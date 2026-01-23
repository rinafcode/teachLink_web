'use client';

import React from 'react';
import { useSearchFilters } from '../../../hooks/useSearchFilters';
import { SearchFilters } from '../../../components/search/SearchFilters';
import { 
    Cpu, 
    Search, 
    Bell, 
    ShoppingBag, 
    ChevronDown, 
    Star, 
    Clock, 
    User, 
    ArrowRight, 
    ChevronLeft, 
    ChevronRight,
    RotateCcw,
    X
} from 'lucide-react';

// Extended Mock Data (18 items)
const MOCK_RESULTS = [
    {
        id: "CS-101",
        title: "Advanced UI/UX Masterclass for Digital Products",
        instructor: "Dr. Sarah Connor",
        duration: "12h 45m",
        rating: 4.9,
        price: 84.99,
        originalPrice: 129.99,
        category: "Design",
        level: "advanced",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCil99ZvcYdOTX2ikzfmezXpX8PM1gdqvlH9POOIWtf_oLnLUykcTbi_AmwTRyHd91SesbJSqYVeMRowIU8LwxAMfmlo6f_Pz1u8SrLX6MRh78Y4jM36RyPsfr3f6KzeGWxm4kZXTGblOlSET-GxfYpd_Nzdu1P0AVyTV6bpa_jwzSu1ZfKYb7SrSNphUJwOZowmvViRp-dqkbRQYrkWbuITbMKEf_FdUEefC39x97j6p9fuc1eF7A1Z3QFUZVecRUTOyGnzRBp9_Q",
        tag: "Bestseller",
        color: "primary"
    },
    {
        id: "MK-204",
        title: "Data-Driven Growth Strategies for Startups",
        instructor: "James Wilson",
        duration: "8h 20m",
        rating: 4.7,
        price: 49.99,
        originalPrice: null,
        category: "Marketing",
        level: "intermediate",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvzbzuSjw86VeI3OOXElSHJGSEvvzouGyeAW34jd3Px-Io4QsMww1pfJW7UOrjmNJJJ_DaLMU81Np88h_XCXTqDiDlcl9mNDYwjXXpxgNJJDTWfwEiAukRqT_aWTm9KNnK-6hjRAZZ1EPYs-Sz8NXTSel_BwuZekfnzd5n0JxMSoI2ke-DWJeJv42Df58VwTZCOadgRyZ6ktv0syTD-xYuIuPk4fe0vYDgPEqVPNAigyQsq3AxWqvfnpntYxcLt3ABxf7aaTSb1cQ",
        tag: null,
        color: "purple"
    },
    {
        id: "GD-009",
        title: "Professional Branding: From Concept to Launch",
        instructor: "Dr. Sarah Connor",
        duration: "15h 10m",
        rating: 4.5,
        price: 119.00,
        originalPrice: null,
        category: "Design",
        level: "beginner",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCreAkOdseX9ZVH36oFGC3i0Q7D-DQz4x3zJL5NDtMSwfta8Qw886FBxG-IqaeUipdJkrptvGNhoKABpUsxpWM3mdOIUqxuJd_fIs7rU40m72S62pZ5kpdbKsqlJVJyqsi2WWJEkXEWJbKJwxP8BauVhNPiCvvFftKmHNbg7YM1sd5mq65ce7SyfNYQF70fI6FtiiqDZsVImVhLv0vn7St75HI9mz129PyeaPssxNqC7teU9A8by_hsz-wROUBDqIZLBErccnO0oQ",
        tag: null,
        color: "primary"
    },
    // ... Duplicates to reach 18 items mocked logic
    { id: "AN-552", title: "Google Ads Mastery for E-commerce", instructor: "James Wilson", duration: "5h 50m", rating: 4.8, price: 34.99, originalPrice: 89.99, category: "Marketing", level: "intermediate", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoFDaPZkb_a_9wKkiFmCfSsK_WQ9z22NduZ7EKN_4251P8pEXbVY1531dpxQVx52NJ5HGozzDTKgEcUgfjqeCHZYC9wZsUeXO7Ee4-Zvzk8E2pJjmkve2DG-6KhkGrmwF7GsZ1YTWlj9qoI5jeChgImeCyHLxEhaJjNVLZTMy4A1JcQ8JAi4xjo5VA7MDCR4hNvf6MEwONIfq_vs2oTZo7piHhIi9QIBecNZJFmD8xyJnVdZ-EK2q6m1ijabQq00clOT_hVkv2mU8" },
    { id: "WD-300", title: "Modern Web Design with Figma and Webflow", instructor: "Dr. Sarah Connor", duration: "22h 30m", rating: 4.6, price: 99.00, originalPrice: null, category: "Design", level: "advanced", color: "primary", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAC6NhUUHDRqyDaSzJlgNygr56BoDO_8fQcX3et2Wnp8VDx35N3nXgqbR-Xt6LuiN8hBJJaqe85edLCUHF5Bfgu7Px9PPIjEpbNqBu_b_BBAFHrqEGmReNkqR478aid53gP2dmZgNyG55_bI7DNrVWMgb85BYuA7qVKC-a25Qn5MboAwsL8FmgvO-VnOtPKgxx-yRNmHY4bAzrF8d9nAusUx1x_WpNRHMsGsuZkOktb-WhkFhppcyDN489FP793xIA_CTxtWMSe0r4" },
    { id: "SM-881", title: "Social Media Marketing: Zero to Hero", instructor: "James Wilson", duration: "10h 00m", rating: 4.9, price: 24.99, originalPrice: 74.99, category: "Marketing", level: "beginner", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUd6QuR7Rp0azAg6bhUKGrn8eqsVDX9Ry8ezok66U35Rnc39EGF8e_4RTwbxJKMv-73ahqf8f5ZB9b93NmWiNPSK8EnFcIr6DteWxx7yWzlyXRTn5Ti-5vmkE6VCeszMwgLEntCvZqhhTZrqr2Jn9RHsXJsFVCynv4RsUCpiG3B-L_NPzkyO3IFkYBfoMOmsHnLUsFI4SXKQGRME81AAq--3NMDs_chLm5cXIc-AdEeXiMFUIGBH9GllgnintdJWon-xXTl_1BWos" },
    // Repeat to simulate more results
    { id: "CS-102", title: "Prototyping High Fidelity Interfaces", instructor: "Dr. Sarah Connor", duration: "08h 15m", rating: 4.7, price: 55.00, originalPrice: null, category: "Design", level: "intermediate", color: "primary", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCil99ZvcYdOTX2ikzfmezXpX8PM1gdqvlH9POOIWtf_oLnLUykcTbi_AmwTRyHd91SesbJSqYVeMRowIU8LwxAMfmlo6f_Pz1u8SrLX6MRh78Y4jM36RyPsfr3f6KzeGWxm4kZXTGblOlSET-GxfYpd_Nzdu1P0AVyTV6bpa_jwzSu1ZfKYb7SrSNphUJwOZowmvViRp-dqkbRQYrkWbuITbMKEf_FdUEefC39x97j6p9fuc1eF7A1Z3QFUZVecRUTOyGnzRBp9_Q" },
    { id: "MK-205", title: "SEO Fundamentals 2024", instructor: "James Wilson", duration: "6h 45m", rating: 4.6, price: 39.99, originalPrice: 79.99, category: "Marketing", level: "beginner", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvzbzuSjw86VeI3OOXElSHJGSEvvzouGyeAW34jd3Px-Io4QsMww1pfJW7UOrjmNJJJ_DaLMU81Np88h_XCXTqDiDlcl9mNDYwjXXpxgNJJDTWfwEiAukRqT_aWTm9KNnK-6hjRAZZ1EPYs-Sz8NXTSel_BwuZekfnzd5n0JxMSoI2ke-DWJeJv42Df58VwTZCOadgRyZ6ktv0syTD-xYuIuPk4fe0vYDgPEqVPNAigyQsq3AxWqvfnpntYxcLt3ABxf7aaTSb1cQ" },
    { id: "GD-010", title: "Typography in Modern Web", instructor: "Dr. Sarah Connor", duration: "4h 30m", rating: 4.8, price: 29.99, originalPrice: null, category: "Design", level: "intermediate", color: "primary", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCreAkOdseX9ZVH36oFGC3i0Q7D-DQz4x3zJL5NDtMSwfta8Qw886FBxG-IqaeUipdJkrptvGNhoKABpUsxpWM3mdOIUqxuJd_fIs7rU40m72S62pZ5kpdbKsqlJVJyqsi2WWJEkXEWJbKJwxP8BauVhNPiCvvFftKmHNbg7YM1sd5mq65ce7SyfNYQF70fI6FtiiqDZsVImVhLv0vn7St75HI9mz129PyeaPssxNqC7teU9A8by_hsz-wROUBDqIZLBErccnO0oQ" },
    { id: "AN-553", title: "Conversion Rate Optimization", instructor: "James Wilson", duration: "12h 00m", rating: 4.9, price: 95.00, originalPrice: null, category: "Marketing", level: "advanced", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoFDaPZkb_a_9wKkiFmCfSsK_WQ9z22NduZ7EKN_4251P8pEXbVY1531dpxQVx52NJ5HGozzDTKgEcUgfjqeCHZYC9wZsUeXO7Ee4-Zvzk8E2pJjmkve2DG-6KhkGrmwF7GsZ1YTWlj9qoI5jeChgImeCyHLxEhaJjNVLZTMy4A1JcQ8JAi4xjo5VA7MDCR4hNvf6MEwONIfq_vs2oTZo7piHhIi9QIBecNZJFmD8xyJnVdZ-EK2q6m1ijabQq00clOT_hVkv2mU8" },
    { id: "WD-301", title: "CSS Grid & Flexbox Mastery", instructor: "Dr. Sarah Connor", duration: "7h 15m", rating: 4.9, price: 44.99, originalPrice: 60.00, category: "Design", level: "intermediate", color: "primary", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAC6NhUUHDRqyDaSzJlgNygr56BoDO_8fQcX3et2Wnp8VDx35N3nXgqbR-Xt6LuiN8hBJJaqe85edLCUHF5Bfgu7Px9PPIjEpbNqBu_b_BBAFHrqEGmReNkqR478aid53gP2dmZgNyG55_bI7DNrVWMgb85BYuA7qVKC-a25Qn5MboAwsL8FmgvO-VnOtPKgxx-yRNmHY4bAzrF8d9nAusUx1x_WpNRHMsGsuZkOktb-WhkFhppcyDN489FP793xIA_CTxtWMSe0r4" },
    { id: "SM-882", title: "Instagram Content Strategy", instructor: "James Wilson", duration: "3h 45m", rating: 4.5, price: 19.99, originalPrice: null, category: "Marketing", level: "beginner", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUd6QuR7Rp0azAg6bhUKGrn8eqsVDX9Ry8ezok66U35Rnc39EGF8e_4RTwbxJKMv-73ahqf8f5ZB9b93NmWiNPSK8EnFcIr6DteWxx7yWzlyXRTn5Ti-5vmkE6VCeszMwgLEntCvZqhhTZrqr2Jn9RHsXJsFVCynv4RsUCpiG3B-L_NPzkyO3IFkYBfoMOmsHnLUsFI4SXKQGRME81AAq--3NMDs_chLm5cXIc-AdEeXiMFUIGBH9GllgnintdJWon-xXTl_1BWos" },
    { id: "CS-103", title: "Advanced UI/UX 3", instructor: "Sarah Connor", duration: "10h", rating: 4.9, price: 80, originalPrice: 100, category: "Design", level: "advanced", color: "primary", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCil99ZvcYdOTX2ikzfmezXpX8PM1gdqvlH9POOIWtf_oLnLUykcTbi_AmwTRyHd91SesbJSqYVeMRowIU8LwxAMfmlo6f_Pz1u8SrLX6MRh78Y4jM36RyPsfr3f6KzeGWxm4kZXTGblOlSET-GxfYpd_Nzdu1P0AVyTV6bpa_jwzSu1ZfKYb7SrSNphUJwOZowmvViRp-dqkbRQYrkWbuITbMKEf_FdUEefC39x97j6p9fuc1eF7A1Z3QFUZVecRUTOyGnzRBp9_Q" },
    { id: "MK-206", title: "Marketing 3", instructor: "James Wilson", duration: "8h", rating: 4.7, price: 40, originalPrice: null, category: "Marketing", level: "intermediate", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvzbzuSjw86VeI3OOXElSHJGSEvvzouGyeAW34jd3Px-Io4QsMww1pfJW7UOrjmNJJJ_DaLMU81Np88h_XCXTqDiDlcl9mNDYwjXXpxgNJJDTWfwEiAukRqT_aWTm9KNnK-6hjRAZZ1EPYs-Sz8NXTSel_BwuZekfnzd5n0JxMSoI2ke-DWJeJv42Df58VwTZCOadgRyZ6ktv0syTD-xYuIuPk4fe0vYDgPEqVPNAigyQsq3AxWqvfnpntYxcLt3ABxf7aaTSb1cQ" },
    { id: "GD-011", title: "Design 3", instructor: "Sarah Connor", duration: "15h", rating: 4.5, price: 110, originalPrice: null, category: "Design", level: "beginner", color: "primary", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCreAkOdseX9ZVH36oFGC3i0Q7D-DQz4x3zJL5NDtMSwfta8Qw886FBxG-IqaeUipdJkrptvGNhoKABpUsxpWM3mdOIUqxuJd_fIs7rU40m72S62pZ5kpdbKsqlJVJyqsi2WWJEkXEWJbKJwxP8BauVhNPiCvvFftKmHNbg7YM1sd5mq65ce7SyfNYQF70fI6FtiiqDZsVImVhLv0vn7St75HI9mz129PyeaPssxNqC7teU9A8by_hsz-wROUBDqIZLBErccnO0oQ" },
    { id: "AN-554", title: "Analytics 3", instructor: "James Wilson", duration: "5h", rating: 4.8, price: 30, originalPrice: 80, category: "Marketing", level: "advanced", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoFDaPZkb_a_9wKkiFmCfSsK_WQ9z22NduZ7EKN_4251P8pEXbVY1531dpxQVx52NJ5HGozzDTKgEcUgfjqeCHZYC9wZsUeXO7Ee4-Zvzk8E2pJjmkve2DG-6KhkGrmwF7GsZ1YTWlj9qoI5jeChgImeCyHLxEhaJjNVLZTMy4A1JcQ8JAi4xjo5VA7MDCR4hNvf6MEwONIfq_vs2oTZo7piHhIi9QIBecNZJFmD8xyJnVdZ-EK2q6m1ijabQq00clOT_hVkv2mU8" },
    { id: "WD-302", title: "Web Design 3", instructor: "Sarah Connor", duration: "22h", rating: 4.6, price: 90, originalPrice: null, category: "Design", level: "intermediate", color: "primary", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAC6NhUUHDRqyDaSzJlgNygr56BoDO_8fQcX3et2Wnp8VDx35N3nXgqbR-Xt6LuiN8hBJJaqe85edLCUHF5Bfgu7Px9PPIjEpbNqBu_b_BBAFHrqEGmReNkqR478aid53gP2dmZgNyG55_bI7DNrVWMgb85BYuA7qVKC-a25Qn5MboAwsL8FmgvO-VnOtPKgxx-yRNmHY4bAzrF8d9nAusUx1x_WpNRHMsGsuZkOktb-WhkFhppcyDN489FP793xIA_CTxtWMSe0r4" },
    { id: "SM-883", title: "Social Media 3", instructor: "James Wilson", duration: "10h", rating: 4.9, price: 20, originalPrice: 70, category: "Marketing", level: "beginner", color: "purple", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUd6QuR7Rp0azAg6bhUKGrn8eqsVDX9Ry8ezok66U35Rnc39EGF8e_4RTwbxJKMv-73ahqf8f5ZB9b93NmWiNPSK8EnFcIr6DteWxx7yWzlyXRTn5Ti-5vmkE6VCeszMwgLEntCvZqhhTZrqr2Jn9RHsXJsFVCynv4RsUCpiG3B-L_NPzkyO3IFkYBfoMOmsHnLUsFI4SXKQGRME81AAq--3NMDs_chLm5cXIc-AdEeXiMFUIGBH9GllgnintdJWon-xXTl_1BWos" }
];

export default function SearchPage() {
  const { filters, setFilters, resetFilters } = useSearchFilters(); 
  const [currentPage, setCurrentPage] = React.useState(1);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [drawerVisible, setDrawerVisible] = React.useState(false);
  const ITEMS_PER_PAGE = 6;

    React.useEffect(() => {
            if (isFilterOpen) {
                    requestAnimationFrame(() => setDrawerVisible(true));
            } else {
                    setDrawerVisible(false);
            }
    }, [isFilterOpen]);

  // Filter Logic Implementation (Client-side mocking)
  const filteredResults = MOCK_RESULTS.filter(course => {
      // 1. Level (Difficulty)
      if (filters.difficulty && filters.difficulty.length > 0) {
          if (!filters.difficulty.includes(course.level)) return false;
      }

      // 2. Duration (Parse "12h 45m" -> hours)
      const durationMatch = course.duration.match(/^(\d+)h/);
      const hours = durationMatch ? parseInt(durationMatch[1]) : 0;
      if (hours > filters.duration) return false;

      // 3. Instructor (Search by name)
      if (filters.instructor && filters.instructor.trim() !== '') {
          const searchTerm = filters.instructor.toLowerCase();
          const instructorName = course.instructor.toLowerCase();
          if (!instructorName.includes(searchTerm)) return false;
      }

      // 4. Search term (title or category)
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
          const term = filters.searchTerm.toLowerCase();
          const inTitle = course.title.toLowerCase().includes(term);
          const inCategory = course.category.toLowerCase().includes(term);
          const inInstructor = course.instructor.toLowerCase().includes(term);
          if (!inTitle && !inCategory && !inInstructor) return false;
      }

      // 5. Topics (Check category or title)
      if (filters.topics && filters.topics.length > 0) {
          const hasTopic = filters.topics.some((topic: string) => {
              const topicLower = topic.toLowerCase();
              const categoryLower = course.category.toLowerCase();
              const titleLower = course.title.toLowerCase();
              return categoryLower.includes(topicLower) || titleLower.includes(topicLower);
          });
          if (!hasTopic) return false;
      }

      // 6. Price
      if (course.price > filters.priceRange) return false;

      return true;
  });

  // Sorting logic
  const sortedResults = React.useMemo(() => {
      const copy = [...filteredResults];
      switch (filters.sort) {
          case 'price_asc':
              return copy.sort((a, b) => a.price - b.price);
          case 'rating':
              return copy.sort((a, b) => b.rating - a.rating);
          case 'newest':
              return copy; // no date field, keep original order
          default:
              return copy; // relevance: keep filtered order
      }
  }, [filteredResults, filters.sort]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedResults.length / ITEMS_PER_PAGE);
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
      setCurrentPage(1);
  }, [
      filters.difficulty.join(','), 
      filters.topics.join(','), 
      filters.instructor, 
      filters.duration,
      filters.priceRange,
      filters.searchTerm
  ]);

  // Ensure currentPage is within bounds
  const safePage = Math.min(currentPage, Math.max(1, totalPages || 1));
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedResults = sortedResults.slice(startIndex, endIndex);

  return (
    <div className="bg-white text-slate-800 font-sans antialiased relative min-h-screen">
        <div className="fixed inset-0 bg-grid-pattern grid-bg pointer-events-none z-0 opacity-80"></div>
        
        

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Sidebar desktop */}
                <div className="hidden lg:block">
                    <SearchFilters 
                        filters={filters} 
                        setFilters={setFilters} 
                        resetFilters={resetFilters} 
                    />
                </div>

                <div className="flex-1">
                    {/* Results Header */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <h1 className="text-2xl font-display font-bold text-slate-900">Results</h1>
                                </div>
                                <p className="font-mono text-xs text-slate-400 tracking-wide">
                                    <span className="text-primary font-bold">{sortedResults.length}</span> MATCHES FOUND 
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 text-xs font-mono font-bold uppercase tracking-widest text-slate-600 hover:border-primary hover:text-primary transition-colors"
                                    onClick={() => setIsFilterOpen(true)}
                                >
                                    Filter
                                </button>
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Sort Order</span>
                                <div className="relative">
                                    <select 
                                        className="appearance-none pl-4 pr-10 py-2 border border-slate-200 bg-white rounded-md text-xs font-mono font-medium text-slate-700 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer hover:border-slate-300 transition-all outline-none"
                                        value={filters.sort}
                                        onChange={(e) => setFilters({ sort: e.target.value })}
                                    >
                                        <option value="relevance">RELEVANCE_DESC</option>
                                        <option value="newest">DATE_NEWEST</option>
                                        <option value="rating">RATING_HIGH</option>
                                        <option value="price_asc">PRICE_ASC</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Body search bar */}
                        <div className="relative w-full group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-2.5 rounded-md border border-slate-200 bg-surface-subtle/50 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary text-sm font-mono placeholder:font-sans transition-all placeholder:text-slate-400 outline-none" 
                                placeholder="SEARCH_DATABASE" 
                                value={filters.searchTerm}
                                onChange={(e) => setFilters({ searchTerm: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Mobile Filter Drawer */}
                    {isFilterOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            <div 
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" 
                                onClick={() => setIsFilterOpen(false)}
                            ></div>
                            <div className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl border-l border-slate-200 p-4 overflow-y-auto transform transition-all duration-300 ease-out ${drawerVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-mono font-bold uppercase tracking-widest text-slate-700">Filters</span>
                                    <button 
                                        className="p-2 rounded-md text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors"
                                        onClick={() => setIsFilterOpen(false)}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <SearchFilters 
                                    filters={filters} 
                                    setFilters={(f) => { setFilters(f); }} 
                                    resetFilters={() => { resetFilters(); setIsFilterOpen(false); }} 
                                />
                            </div>
                        </div>
                    )}

                    {/* Course Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedResults.map((course) => (
                            <div key={course.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary hover:shadow-glow hover:-translate-y-1 transition-all duration-300">
                                <div className="relative h-48 overflow-hidden">
                                    <div className="absolute inset-0 bg-slate-900/5 group-hover:bg-slate-900/0 transition-colors z-10"></div>
                                    <img alt={course.title} className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" src={course.image} />
                                    <div className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-md border border-slate-200 pl-2 pr-3 py-1 rounded-sm flex items-center gap-1.5 shadow-sm">
                                        <Star className="w-3 h-3 text-primary fill-primary" />
                                        <span className="font-mono text-xs font-bold text-slate-800">{course.rating}</span>
                                    </div>
                                    {course.tag && (
                                        <div className="absolute bottom-3 left-3 z-20 flex gap-2">
                                            <span className="px-2 py-1 bg-secondary/90 backdrop-blur-sm text-white font-mono text-[9px] uppercase tracking-wider rounded-sm shadow-sm border border-white/20">
                                                {course.tag}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${course.color === 'purple' ? 'bg-purple-500' : 'bg-primary'}`}></span>
                                            <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${course.color === 'purple' ? 'text-purple-600' : 'text-primary'}`}>
                                                {course.category}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400">ID: {course.id}</span>
                                    </div>
                                    <h3 className="text-lg font-display font-bold text-slate-900 mb-2 leading-tight group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">{course.duration}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-medium text-slate-500">{course.instructor}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-mono font-bold text-slate-900 tracking-tight">${course.price}</span>
                                            {course.originalPrice && (
                                                <span className="text-[10px] text-slate-400 line-through decoration-slate-300">
                                                    ${course.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                        <button className="group/btn relative overflow-hidden bg-primary text-white pl-4 pr-3 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer">
                                            <span className="relative z-10">Enroll</span>
                                            <ArrowRight className="w-3.5 h-3.5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-12 pb-8">
                            <nav className="flex items-center gap-2 p-2 bg-white/50 border border-slate-200 rounded-lg backdrop-blur-sm">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                    <button 
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center rounded font-mono text-sm transition-colors ${
                                            currentPage === pageNum 
                                                ? 'bg-primary text-white font-bold shadow-md shadow-primary/30' 
                                                : 'hover:bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </main>   
    </div>
  );
}
