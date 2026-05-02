export interface CMSLesson {
  id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'assignment';
  content: string;
  duration?: string;
  order: number;
}

export interface CMSModule {
  id: string;
  title: string;
  lessons: CMSLesson[];
  order: number;
}

export interface CMSCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  modules: CMSModule[];
}

export interface MediaUploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  url?: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  structure: any; // Can be a partial module or lesson content
}
