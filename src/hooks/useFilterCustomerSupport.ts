'use client';

import { useCallback, useState } from 'react';

export interface FilterHelpContent {
  id: string;
  title: string;
  description: string;
  tips: string[];
  faqs: { question: string; answer: string }[];
}

const FILTER_HELP_CONTENT: Record<string, FilterHelpContent> = {
  difficulty: {
    id: 'difficulty',
    title: 'Difficulty Level',
    description:
      'Filter courses and tutorials by their difficulty level to find content matching your current skill level. You can select multiple levels simultaneously.',
    tips: [
      'Beginners should start with Beginner level content before advancing',
      'Select multiple levels to broaden your search results',
      'Combine difficulty with topics for more targeted results',
    ],
    faqs: [
      {
        question: 'Can I select more than one difficulty level?',
        answer:
          'Yes, you can check multiple difficulty levels to see content from all selected levels at once.',
      },
      {
        question: 'How is difficulty level determined?',
        answer:
          'Difficulty levels are assigned by content creators based on prerequisites, complexity, and target audience.',
      },
    ],
  },
  duration: {
    id: 'duration',
    title: 'Duration',
    description:
      'Set a maximum duration for courses or tutorials. Use the slider to filter content that fits your available time.',
    tips: [
      'Drag the slider handle to adjust the maximum duration',
      'Shorter durations (1-5h) are ideal for quick learning sessions',
      'Longer durations (20h+) are typically comprehensive courses',
    ],
    faqs: [
      {
        question: 'What does the duration slider do?',
        answer:
          'The slider sets the maximum course length. Only courses shorter than or equal to the selected value will be shown.',
      },
      {
        question: 'Can I set a minimum duration?',
        answer:
          'Currently, only a maximum duration filter is available. We may add minimum duration in a future update.',
      },
    ],
  },
  price: {
    id: 'price',
    title: 'Price',
    description:
      'Filter content by price range. Set a maximum price to find courses within your budget.',
    tips: [
      'Use the slider to set your maximum budget',
      'Many free courses are available — set the slider to $0 to find them',
      'Paid courses often include additional resources and certificates',
    ],
    faqs: [
      {
        question: 'Are there free courses available?',
        answer:
          'Yes, many courses are free. Set the price slider to $0 to browse only free content.',
      },
      {
        question: 'What currency are prices shown in?',
        answer: 'Prices are displayed in USD. Currency conversion is not currently supported.',
      },
    ],
  },
  topics: {
    id: 'topics',
    title: 'Topics',
    description:
      'Narrow your search by selecting specific topics. You can choose multiple topics to find content covering various subjects.',
    tips: [
      'Type to search for topics if the list is long',
      'Select multiple topics to find interdisciplinary content',
      'Start with broad topics, then narrow down with other filters',
    ],
    faqs: [
      {
        question: 'How many topics can I select?',
        answer: 'There is no limit. Select as many topics as you need to refine your search.',
      },
      {
        question: 'Can I search for topics not in the list?',
        answer:
          'The topic list shows available categories. If you need a specific topic, try using the main search bar instead.',
      },
    ],
  },
  instructor: {
    id: 'instructor',
    title: 'Instructor',
    description:
      'Filter content by instructor. Search for a specific instructor or select from the suggested list.',
    tips: [
      'Type part of an instructor name to search',
      'Click on a suggested instructor to select or deselect them',
      'Following specific instructors helps you find consistent teaching styles',
    ],
    faqs: [
      {
        question: 'Can I select multiple instructors?',
        answer:
          'Currently, only one instructor can be selected at a time. This helps narrow down results more effectively.',
      },
      {
        question: 'How do I clear an instructor selection?',
        answer:
          'Click the selected instructor again to deselect them, or use the Reset Parameters button.',
      },
    ],
  },
  'content-type': {
    id: 'content-type',
    title: 'Content Type',
    description:
      'Choose the type of content you want to browse. Filter between posts, courses, tutorials, authors, and topics.',
    tips: [
      'Select "All Content" to see everything available',
      'Use specific types when you know what format you prefer',
      'Tutorials are typically shorter and more focused than courses',
    ],
    faqs: [
      {
        question: 'What is the difference between a course and a tutorial?',
        answer:
          'Courses are comprehensive learning paths with multiple modules. Tutorials are shorter, focused lessons on specific topics.',
      },
      {
        question: "What does 'Authors' content type show?",
        answer:
          "The 'Authors' type shows content creators and instructors rather than content itself. Select an author to see their profile and work.",
      },
    ],
  },
  rating: {
    id: 'rating',
    title: 'Minimum Rating',
    description:
      'Filter content by minimum star rating. Choose a rating threshold to only see highly-rated content.',
    tips: [
      'Select 4 stars for the highest quality content',
      'Lower minimum ratings will include more results',
      'Combine with other filters for best results',
    ],
    faqs: [
      {
        question: 'How are ratings calculated?',
        answer:
          'Ratings are averaged from all user reviews. Only content with enough reviews is shown with a rating.',
      },
      {
        question: 'Can I filter by exact rating?',
        answer:
          'The filter shows content with at least the selected rating. For example, selecting 4 stars shows content rated 4 and above.',
      },
    ],
  },
};

export function useFilterCustomerSupport() {
  const [activeHelpId, setActiveHelpId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const getHelpContent = useCallback((id: string): FilterHelpContent | undefined => {
    return FILTER_HELP_CONTENT[id];
  }, []);

  const toggleHelp = useCallback((id: string) => {
    setActiveHelpId((prev) => (prev === id ? null : id));
  }, []);

  const closeHelp = useCallback(() => {
    setActiveHelpId(null);
  }, []);

  const openGuide = useCallback(() => {
    setGuideOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
  }, []);

  return {
    FILTER_HELP_CONTENT,
    activeHelpId,
    guideOpen,
    getHelpContent,
    toggleHelp,
    closeHelp,
    openGuide,
    closeGuide,
  };
}
