/**
 * Filter Controls: Job Matching (#414).
 *
 * Pure encoding of filter controls + a matchJobs() helper that ranks a list
 * of postings against a candidate profile. Designed to be co-located with
 * existing filter-component code without bringing in a heavy dependency.
 */

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  skills: string[];
  location: string;
  remote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  postedAt: string; // ISO
}

export interface CandidateProfile {
  skills: string[];
  preferredLocations: string[];
  openToRemote: boolean;
  minSalary?: number;
}

export interface MatchingWeights {
  skill: number;
  location: number;
  salary: number;
  recency: number;
}

export const DEFAULT_WEIGHTS: MatchingWeights = {
  skill: 0.5,
  location: 0.2,
  salary: 0.2,
  recency: 0.1,
};

export interface JobQuery {
  text?: string;
  skills?: string[];
  location?: string;
  remoteOnly?: boolean;
  minSalary?: number;
}

export function applyQuery(postings: JobPosting[], query: JobQuery): JobPosting[] {
  const text = query.text?.toLowerCase().trim();
  const skillSet = new Set((query.skills ?? []).map((s) => s.toLowerCase()));
  return postings.filter((j) => {
    if (text && !`${j.title} ${j.company}`.toLowerCase().includes(text)) {
      return false;
    }
    for (const s of skillSet) {
      if (!j.skills.some((js) => js.toLowerCase() === s)) return false;
    }
    if (query.location && j.location !== query.location) return false;
    if (query.remoteOnly && !j.remote) return false;
    if (query.minSalary != null && (j.salaryMax ?? 0) < query.minSalary) {
      return false;
    }
    return true;
  });
}

interface ScoredJob {
  job: JobPosting;
  score: number;
}

export function matchJobs(
  postings: JobPosting[],
  candidate: CandidateProfile,
  weights: MatchingWeights = DEFAULT_WEIGHTS,
): JobPosting[] {
  const candSkills = new Set(candidate.skills.map((s) => s.toLowerCase()));
  const now = Date.now();

  const scored: ScoredJob[] = postings.map((job) => {
    const overlap = job.skills.filter((s) => candSkills.has(s.toLowerCase()));
    const skillScore = candSkills.size === 0 ? 0 : overlap.length / candSkills.size;

    const locMatch =
      candidate.preferredLocations.includes(job.location) || (candidate.openToRemote && job.remote)
        ? 1
        : 0;

    const salaryScore =
      candidate.minSalary == null || job.salaryMax == null
        ? 0.5
        : job.salaryMax >= candidate.minSalary
          ? 1
          : 0;

    const ageDays = Math.max(1, Math.floor((now - Date.parse(job.postedAt)) / 86_400_000));
    const recencyScore = Math.max(0, 1 - ageDays / 60);

    const score =
      weights.skill * skillScore +
      weights.location * locMatch +
      weights.salary * salaryScore +
      weights.recency * recencyScore;

    return { job, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.job);
}
