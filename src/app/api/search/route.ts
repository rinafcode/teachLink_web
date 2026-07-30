import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';
import { edgeLog, CDN_CACHE_HEADERS } from '@/../infra/edge-config';
import { withSecurityHeaders, sanitizeObject } from '@/lib/security';

export const runtime = 'edge';

interface SearchResult {
  id: string;
  title: string;
  category: 'course' | 'instructor' | 'topic' | 'investment';
  instructor?: string;
  rating?: number;
  price?: number;
  image?: string;
  description?: string;
}

interface CategorizedResults {
  courses: SearchResult[];
  instructors: SearchResult[];
  topics: SearchResult[];
  investments: SearchResult[];
}

// In-memory catalogue backing the header search endpoint.
// In production this would be replaced by a database query or
// an external search-index service (Algolia, Meilisearch, etc.).
const SEARCH_INDEX: SearchResult[] = [
  // --- Courses ---
  { id: 'CS-101', title: 'Advanced UI/UX Masterclass for Digital Products', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.9, price: 84.99, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCil99ZvcYdOTX2ikzfmezXpX8PM1gdqvlH9POOIWtf_oLnLUykcTbi_AmwTRyHd91SesbJSqYVeMRowIU8LwxAMfmlo6f_Pz1u8SrLX6MRh78Y4jM36RyPsfr3f6KzeGWxm4kZXTGblOlSET-GxfYpd_Nzdu1P0AVyTV6bpa_jwzSu1ZfKYb7SrSNphUJwOZowmvViRp-dqkbRQYrkWbuITbMKEf_FdUEefC39x97j6p9fuc1eF7A1Z3QFUZVecRUTOyGnzRBp9_Q' },
  { id: 'MK-204', title: 'Data-Driven Growth Strategies for Startups', category: 'course', instructor: 'James Wilson', rating: 4.7, price: 49.99, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvzbzuSjw86VeI3OOXElSHJGSEvvzouGyeAW34jd3Px-Io4QsMww1pfJW7UOrjmNJJJ_DaLMU81Np88h_XCXTqDiDlcl9mNDYwjXXpxgNJJDTWfwEiAukRqT_aWTm9KNnK-6hjRAZZ1EPYs-Sz8NXTSel_BwuZekfnzd5n0JxMSoI2ke-DWJeJv42Df58VwTZCOadgRyZ6ktv0syTD-xYuIuPk4fe0vYDgPEqVPNAigyQsq3AxWqvfnpntYxcLt3ABxf7aaTSb1cQ' },
  { id: 'GD-009', title: 'Professional Branding: From Concept to Launch', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.5, price: 119.0, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCreAkOdseX9ZVH36oFGC3i0Q7D-DQz4x3zJL5NDtMSwfta8Qw886FBxG-IqaeUipdJkrptvGNhoKABpUsxpWM3mdOIUqxuJd_fIs7rU40m72S62pZ5kpdbKsqlJVJyqsi2WWJEkXEWJbKJwxP8BauVhNPiCvvFftKmHNbg7YM1sd5mq65ce7SyfNYQF70fI6FtiiqDZsVImVhLv0vn7St75HI9mz129PyeaPssxNqC7teU9A8by_hsz-wROUBDqIZLBErccnO0oQ' },
  { id: 'WD-300', title: 'Modern Web Design with Figma and Webflow', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.6, price: 99.0, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC6NhUUHDRqyDaSzJlgNygr56BoDO_8fQcX3et2Wnp8VDx35N3nXgqbR-Xt6LuiN8hBJJaqe85edLCUHF5Bfgu7Px9PPIjEpbNqBu_b_BBAFHrqEGmReNkqR478aid53gP2dmZgNyG55_bI7DNrVWMgb85BYuA7qVKC-a25Qn5MboAwsL8FmgvO-VnOtPKgxx-yRNmHY4bAzrF8d9nAusUx1x_WpNRHMsGsuZkOktb-WhkFhppcyDN489FP793xIA_CTxtWMSe0r4' },
  { id: 'SM-881', title: 'Social Media Marketing: Zero to Hero', category: 'course', instructor: 'James Wilson', rating: 4.9, price: 24.99, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUd6QuR7Rp0azAg6bhUKGrn8eqsVDX9Ry8ezok66U35Rnc39EGF8e_4RTwbxJKMv-73ahqf8f5ZB9b93NmWiNPSK8EnFcIr6DteWxx7yWzlyXRTn5Ti-5vmkE6VCeszMwgLEntCvZqhhTZrqr2Jn9RHsXJsFVCynv4RsUCpiG3B-L_NPzkyO3IFkYBfoMOmsHnLUsFI4SXKQGRME81AAq--3NMDs_chLm5cXIc-AdEeXiMFUIGBH9GllgnintdJWon-xXTl_1BWos' },
  { id: 'CS-102', title: 'Prototyping High Fidelity Interfaces', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.7, price: 55.0, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCil99ZvcYdOTX2ikzfmezXpX8PM1gdqvlH9POOIWtf_oLnLUykcTbi_AmwTRyHd91SesbJSqYVeMRowIU8LwxAMfmlo6f_Pz1u8SrLX6MRh78Y4jM36RyPsfr3f6KzeGWxm4kZXTGblOlSET-GxfYpd_Nzdu1P0AVyTV6bpa_jwzSu1ZfKYb7SrSNphUJwOZowmvViRp-dqkbRQYrkWbuITbMKEf_FdUEefC39x97j6p9fuc1eF7A1Z3QFUZVecRUTOyGnzRBp9_Q' },
  { id: 'FI-101', title: 'Investment Fundamentals for Creators', category: 'course', instructor: 'Dr. Sarah Connor', rating: 4.8, price: 59.99, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80' },
  { id: 'FI-102', title: 'Strategic Investment Planning for Startups', category: 'course', instructor: 'James Wilson', rating: 4.7, price: 69.99, image: 'https://images.unsplash.com/photo-1542223616-0d4b4e2aa77d?auto=format&fit=crop&w=1200&q=80' },

  // --- Instructors ---
  { id: 'INST-001', title: 'Dr. Sarah Connor', category: 'instructor', image: 'https://ui-avatars.com/api/?name=Sarah+Connor', description: 'Expert in UI/UX Design and Web Development' },
  { id: 'INST-002', title: 'James Wilson', category: 'instructor', image: 'https://ui-avatars.com/api/?name=James+Wilson', description: 'Marketing and Growth Strategy Specialist' },
  { id: 'INST-003', title: 'Dr. Emily Chen', category: 'instructor', image: 'https://ui-avatars.com/api/?name=Emily+Chen', description: 'Data Science and Machine Learning Professor' },
  { id: 'INST-004', title: 'Alex Rivera', category: 'instructor', image: 'https://ui-avatars.com/api/?name=Alex+Rivera', description: 'Full-Stack Developer and Cloud Architect' },

  // --- Topics ---
  { id: 'TOPIC-001', title: 'UI/UX Design', category: 'topic', description: 'Learn user interface and user experience design' },
  { id: 'TOPIC-002', title: 'Digital Marketing', category: 'topic', description: 'Master digital marketing strategies' },
  { id: 'TOPIC-003', title: 'Web Development', category: 'topic', description: 'Build modern web applications' },
  { id: 'TOPIC-004', title: 'Data Analysis', category: 'topic', description: 'Analyze and visualize data effectively' },
  { id: 'TOPIC-005', title: 'Machine Learning', category: 'topic', description: 'Explore AI and machine learning fundamentals' },
  { id: 'TOPIC-006', title: 'Investment Planning', category: 'topic', description: 'Strategies for capital allocation and growth' },

  // --- Investment Features ---
  { id: 'INV-101', title: 'Investment Fundamentals for Creators', category: 'investment', description: 'Understand capital allocation, growth opportunities, and risk management.' },
  { id: 'INV-102', title: 'Investment Planning for Startups', category: 'investment', description: 'Learn how to build investor-ready business plans and pitch decks.' },
  { id: 'INV-103', title: 'Strategic Capital Deployment', category: 'investment', description: 'Align project goals with effective investment and sourcing strategies.' },
  { id: 'INV-104', title: 'Angel Investing 101', category: 'investment', description: 'Navigate early-stage investing, valuation, and portfolio diversification.' },
];

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

function matchScore(item: SearchResult, queryTerms: string[]): number {
  const titleNorm = normalize(item.title);
  const descNorm = item.description ? normalize(item.description) : '';
  const instructorNorm = item.instructor ? normalize(item.instructor) : '';

  let score = 0;
  for (const term of queryTerms) {
    if (titleNorm.includes(term)) score += 3;
    if (instructorNorm.includes(term)) score += 2;
    if (descNorm.includes(term)) score += 1;
  }
  return score;
}

export async function GET(request: Request): Promise<NextResponse> {
  edgeLog('info', '/api/search', 'GET request received');

  const { addHeaders, rateLimitResponse } = withRateLimit(request, 'READ');
  if (rateLimitResponse) {
    return withSecurityHeaders(rateLimitResponse) as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    const empty: CategorizedResults = {
      courses: [],
      instructors: [],
      topics: [],
      investments: [],
    };
    const response = withSecurityHeaders(
      addHeaders(NextResponse.json(empty)),
    );
    response.headers.set('Cache-Control', CDN_CACHE_HEADERS.private);
    return response;
  }

  const queryTerms = normalize(q).split(/\s+/).filter(Boolean);

  // Score and classify every index item
  const scored = SEARCH_INDEX
    .map((item) => ({ item, score: matchScore(item, queryTerms) }))
    .filter((entry) => entry.score > 0);

  // Build categorized results, capped at 3 per category
  const categorized: CategorizedResults = {
    courses: scored
      .filter((e) => e.item.category === 'course')
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((e) => e.item),
    instructors: scored
      .filter((e) => e.item.category === 'instructor')
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((e) => e.item),
    topics: scored
      .filter((e) => e.item.category === 'topic')
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((e) => e.item),
    investments: scored
      .filter((e) => e.item.category === 'investment')
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((e) => e.item),
  };

  const sanitized = sanitizeObject(categorized);
  const response = withSecurityHeaders(
    addHeaders(NextResponse.json(sanitized)),
  );
  response.headers.set('Cache-Control', CDN_CACHE_HEADERS.private);
  return response;
}
