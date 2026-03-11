import { query, queryOne, insert, update } from '../config/database';

export interface Lesson {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string; // JSON string
  xp_reward: number;
  duration_minutes: number;
  order_index: number;
  prerequisite_id: number | null;
}

export interface LessonContent {
  sections: LessonSection[];
  quiz: QuizQuestion[];
}

export interface LessonSection {
  type: 'story' | 'text' | 'interactive' | 'image' | 'example';
  content?: string;
  title?: string;
  question?: string;
  options?: string[];
  correctAnswer?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface UserProgress {
  id: number;
  user_id: number;
  lesson_id: number;
  completed: boolean;
  quiz_score: number | null;
  completed_at: Date | null;
}

export interface LessonWithProgress extends Lesson {
  completed: boolean;
  quizScore: number | null;
  locked: boolean;
}

// Get all lessons
export async function getAllLessons(): Promise<Lesson[]> {
  return query<Lesson[]>('SELECT * FROM lessons ORDER BY order_index');
}

// Get lesson by ID
export async function getLessonById(id: number): Promise<Lesson | null> {
  return await queryOne<Lesson>('SELECT * FROM lessons WHERE id = ?', [id]); 
}

// Get lessons with user progress
export async function getLessonsWithProgress(userId: number): Promise<LessonWithProgress[]> {
  const lessons = await getAllLessons();
  const progress = await query<UserProgress[]>(
    'SELECT * FROM user_progress WHERE user_id = ?',
    [userId]
  );
  
  const progressMap = new Map<number, UserProgress>();
  progress.forEach(p => progressMap.set(p.lesson_id, p));
  
  // Determine which lessons are locked
  const completedIds = new Set(
    progress.filter(p => p.completed).map(p => p.lesson_id)
  );
  
  return lessons.map(lesson => {
    const userProgress = progressMap.get(lesson.id);
    const isLocked = lesson.prerequisite_id !== null && !completedIds.has(lesson.prerequisite_id);
    
    return {
      ...lesson,
      completed: userProgress?.completed || false,
      quizScore: userProgress?.quiz_score || null,
      locked: isLocked,
    };
  });
}

// Get lesson content
export async function getLessonContent(
  lessonId: number
): Promise<LessonContent | null> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;

  const content = lesson.content;

  // Already parsed
  if (typeof content === "object") {
    return content as LessonContent;
  }

  // String → parse
  if (typeof content === "string") {
    try {
      return JSON.parse(content) as LessonContent;
    } catch (err) {
      console.error("Invalid JSON in lesson.content", err);
      return null;
    }
  }
  return null
}

// Check if user can access lesson
export async function canAccessLesson(userId: number, lessonId: number): Promise<boolean> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return false;
  
  if (lesson.prerequisite_id === null) return true;
  
  const progress = await queryOne<UserProgress>(
    'SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ? AND completed = TRUE',
    [userId, lesson.prerequisite_id]
  );
  
  return progress !== null;
}

// Mark lesson as completed
export async function completeLesson(
  userId: number,
  lessonId: number,
  quizScore: number
): Promise<{ xpEarned: number; alreadyCompleted: boolean }> {
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  
  // Check if already completed
  const existing = await queryOne<UserProgress>(
    'SELECT * FROM user_progress WHERE user_id = ? AND lesson_id = ?',
    [userId, lessonId]
  );
  
  if (existing?.completed) {
    return { xpEarned: 0, alreadyCompleted: true };
  }
  
  if (existing) {
    await update(
      'UPDATE user_progress SET completed = TRUE, quiz_score = ?, completed_at = NOW() WHERE id = ?',
      [quizScore, existing.id]
    );
  } else {
    await insert(
      'INSERT INTO user_progress (user_id, lesson_id, completed, quiz_score, completed_at) VALUES (?, ?, TRUE, ?, NOW())',
      [userId, lessonId, quizScore]
    );
  }
  
  return { xpEarned: lesson.xp_reward, alreadyCompleted: false };
}

// Get user's learning progress summary
export async function getProgressSummary(userId: number): Promise<{
  lessonsCompleted: number;
  totalLessons: number;
  percentComplete: number;
  categories: Record<string, { completed: number; total: number }>;
}> {
  const lessons = await getAllLessons();
  const progress = await query<UserProgress[]>(
    'SELECT * FROM user_progress WHERE user_id = ? AND completed = TRUE',
    [userId]
  );
  
  const completedIds = new Set(progress.map(p => p.lesson_id));
  const categories: Record<string, { completed: number; total: number }> = {};
  
  lessons.forEach(lesson => {
    if (!categories[lesson.category]) {
      categories[lesson.category] = { completed: 0, total: 0 };
    }
    categories[lesson.category].total++;
    if (completedIds.has(lesson.id)) {
      categories[lesson.category].completed++;
    }
  });
  
  const lessonsCompleted = completedIds.size;
  const totalLessons = lessons.length;
  const percentComplete = totalLessons > 0 
    ? Math.round((lessonsCompleted / totalLessons) * 100 * 10) / 10 
    : 0;
  
  return {
    lessonsCompleted,
    totalLessons,
    percentComplete,
    categories,
  };
}
