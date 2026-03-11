import { Router, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import * as LearningService from '../services/learningService';
import * as Lesson from '../models/Lesson';
import { successResponse, errorResponse } from '../utils/helpers';

const router = Router();

// Get all lessons
router.get('/lessons', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user) {
      const lessons = await LearningService.getLessonsForUser(req.user.userId);
      res.json(successResponse(lessons.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        category: l.category,
        difficulty: l.difficulty,
        xpReward: l.xp_reward,
        duration: `${l.duration_minutes} min`,
        completed: l.completed,
        locked: l.locked,
      }))));
    } else {
      const lessons = await Lesson.getAllLessons();
      res.json(successResponse(lessons.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        category: l.category,
        difficulty: l.difficulty,
        xpReward: l.xp_reward,
        duration: `${l.duration_minutes} min`,
        completed: false,
        locked: l.order_index > 1,
      }))));
    }
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get lessons'));
  }
});

// Get lesson content
router.get('/lessons/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lessonId = parseInt(req.params.id);
    
    const lesson = await LearningService.getLessonDetail(req.user!.userId, lessonId);
    
    res.json(successResponse(lesson));
  } catch (error) {
    console.error('Get lesson error:', error);
    if (error instanceof Error && error.message.includes('locked')) {
      res.status(403).json(errorResponse('LOCKED', error.message));
    } else if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Lesson not found'));
    } else {
      res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get lesson'));
    }
  }
});

// Complete a lesson
router.post(
  '/lessons/:id/complete',
  authenticate,
  validate([
    body('quizScore').isInt({ min: 0, max: 100 }).withMessage('Quiz score must be 0-100'),
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id);
      const { quizScore } = req.body;
      
      const result = await LearningService.completeLesson(
        req.user!.userId,
        lessonId,
        quizScore
      );
      
      res.json(successResponse(result, 'Lesson completed!'));
    } catch (error) {
      console.error('Complete lesson error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json(errorResponse('NOT_FOUND', 'Lesson not found'));
      } else {
        res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to complete lesson'));
      }
    }
  }
);

// Get learning progress
router.get('/progress', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const progress = await LearningService.getProgress(req.user!.userId);
    res.json(successResponse(progress));
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get progress'));
  }
});

export default router;
