export type VideoSource = {
  label: string;
  src: string;
  type?: string;
};

export type TranscriptCue = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type VideoBookmark = {
  id: string;
  title: string;
  note: string;
  time: number;
  thumbnail: string | null;
  createdAt: string;
};

export type VideoAnnotation = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  time: number;
  createdAt: string;
};
