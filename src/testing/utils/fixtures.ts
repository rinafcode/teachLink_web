// ──────────────────────────────────────────────────────────────────────────────
// src/testing/utils/fixtures.ts
//
// Centralised, reusable test data.
// Use the factory functions to generate single objects, or the preset arrays
// (COURSES, USERS, etc.) for collection-level tests.
// ──────────────────────────────────────────────────────────────────────────────

import { SearchResult } from "@/components/virtualizedsearchresults";
import { Course } from "@/types";


// ──────────────────────────────────────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────────────────────────────────────

let _seq = 0;
function seq(prefix = "") {
  return `${prefix}${++_seq}`;
}

/** Reset auto-increment counter between test suites */
export function resetFixtureCounter() {
  _seq = 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// Course fixtures
// ──────────────────────────────────────────────────────────────────────────────

export function makeCourse(overrides: Partial<Course> = {}): Course {
  const id = seq("course-");
  return {
    id,
    title: `Test Course ${id}`,
    description: `Description for test course ${id}`,
    instructor: "Jane Doe",
    duration: "4h 30m",
    totalLessons: 10,
    progress: 0,
    size: "250 MB",
    thumbnailUrl: `https://picsum.photos/seed/${id}/320/180`,
    downloaded: false,
    ...overrides,
  };
}

export function makeCourses(count: number, overrides: Partial<Course> = {}): Course[] {
  return Array.from({ length: count }, () => makeCourse(overrides));
}

export const COURSES: Course[] = [
  makeCourse({ title: "Introduction to TypeScript", instructor: "Alice Smith", progress: 100}),
  makeCourse({ title: "React Performance Patterns", instructor: "Bob Lee", progress: 42,  }),
  makeCourse({ title: "Node.js Microservices", instructor: "Carol White", progress: 0,}),
  makeCourse({ title: "CSS Architecture", instructor: "Dan Brown", progress: 75,}),
  makeCourse({ title: "Testing with Vitest", instructor: "Eve Davis", progress: 20,}),
];

// ──────────────────────────────────────────────────────────────────────────────
// Search result fixtures
// ──────────────────────────────────────────────────────────────────────────────

export function makeSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  const id = seq("result-");
  return {
    id,
    type: "course",
    title: `Search Result ${id}`,
    subtitle: "Subtitle text",
    description: "Short description for the result item.",
    ...overrides,
  };
}

export function makeSearchResults(
  count: number,
  overrides: Partial<SearchResult> = {}
): SearchResult[] {
  return Array.from({ length: count }, () => makeSearchResult(overrides));
}

export const SEARCH_RESULTS: SearchResult[] = [
  makeSearchResult({ type: "course", title: "TypeScript Fundamentals" }),
  makeSearchResult({ type: "user", title: "Alice Smith", subtitle: "Frontend Engineer" }),
  makeSearchResult({ type: "post", title: "How to optimise React re-renders", description: "A deep-dive post." }),
  makeSearchResult({ type: "file", title: "Q3 Report.pdf", subtitle: "Uploaded 3 days ago" }),
];

// ──────────────────────────────────────────────────────────────────────────────
// Message fixtures
// ──────────────────────────────────────────────────────────────────────────────

export interface MessageFixture {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status: "sent" | "delivered" | "read";
}

export function makeMessage(overrides: Partial<MessageFixture> = {}): MessageFixture {
  const id = seq("msg-");
  return {
    id,
    senderId: "user-1",
    senderName: "Alice",
    content: `Hello, this is message ${id}.`,
    timestamp: new Date(Date.now() - Math.random() * 3_600_000),
    isOwn: false,
    status: "read",
    ...overrides,
  };
}

export function makeMessages(count: number, overrides: Partial<MessageFixture> = {}): MessageFixture[] {
  return Array.from({ length: count }, () => makeMessage(overrides));
}

export const MESSAGES: MessageFixture[] = [
  makeMessage({ senderId: "user-2", senderName: "Bob", content: "Hey, how are you?" }),
  makeMessage({ senderId: "user-1", senderName: "Alice", content: "I'm great, thanks!", isOwn: true, status: "read" }),
  makeMessage({ senderId: "user-2", senderName: "Bob", content: "Can you review my PR?" }),
  makeMessage({ senderId: "user-1", senderName: "Alice", content: "Sure, sending comments now.", isOwn: true, status: "delivered" }),
];

// ──────────────────────────────────────────────────────────────────────────────
// Notification fixtures
// ──────────────────────────────────────────────────────────────────────────────

export interface NotificationFixture {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export function makeNotification(overrides: Partial<NotificationFixture> = {}): NotificationFixture {
  const id = seq("notif-");
  return {
    id,
    type: "info",
    title: `Notification ${id}`,
    body: "This is a test notification body.",
    timestamp: new Date(Date.now() - Math.random() * 86_400_000),
    read: false,
    ...overrides,
  };
}

export function makeNotifications(
  count: number,
  overrides: Partial<NotificationFixture> = {}
): NotificationFixture[] {
  return Array.from({ length: count }, () => makeNotification(overrides));
}

export const NOTIFICATIONS: NotificationFixture[] = [
  makeNotification({ title: "Course completed!", body: "You finished TypeScript Fundamentals." }),
  makeNotification({ title: "New message from Bob", body: "Can you review my PR?" }),
  makeNotification({  title: "Subscription expiring soon", body: "Your plan expires in 3 days.", read: true }),
  makeNotification({ title: "Scheduled maintenance", body: "Downtime on Saturday 02:00–04:00 UTC." }),
];

// ──────────────────────────────────────────────────────────────────────────────
// Common user fixture (reused across domain objects)
// ──────────────────────────────────────────────────────────────────────────────

export interface UserFixture {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "student" | "instructor" | "admin";
}

export function makeUser(overrides: Partial<UserFixture> = {}): UserFixture {
  const id = seq("user-");
  return {
    id,
    name: `Test User ${id}`,
    email: `user${id}@example.com`,
    role: "student",
    ...overrides,
  };
}

export const USERS: UserFixture[] = [
  makeUser({ name: "Alice Smith", email: "alice@example.com", role: "instructor" }),
  makeUser({ name: "Bob Lee", email: "bob@example.com", role: "student" }),
  makeUser({ name: "Carol Admin", email: "carol@example.com", role: "admin" }),
];