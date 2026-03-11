import { Router, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { authenticate, generateToken, AuthenticatedRequest } from '../middleware/auth';
import * as User from '../models/User';
import { successResponse, errorResponse, isValidEmail, isValidAge } from '../utils/helpers';

const router = Router();

// Register new user
router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('username')
      .isLength({ min: 3, max: 20 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-20 characters, alphanumeric and underscores only'),
    body('age').isInt({ min: 13, max: 100 }).withMessage('Age must be between 13 and 100'),
  ]),
  async (req, res: Response) => {
    try {
      const { email, password, username, age } = req.body;
      
      // Check if email already exists
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        res.status(400).json(errorResponse('EMAIL_EXISTS', 'Email already registered'));
        return;
      }
      
      // Check if username already exists
      const existingUsername = await User.findByUsername(username);
      if (existingUsername) {
        res.status(400).json(errorResponse('USERNAME_EXISTS', 'Username already taken'));
        return;
      }
      
      // Create user
      const user = await User.createUser({ email, password, username, age });
      
      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });
      
      res.status(201).json(successResponse({
        user: User.toPublicUser(user),
        token,
      }, 'Registration successful'));
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json(errorResponse('SERVER_ERROR', 'Registration failed'));
    }
  }
);

// Login
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  async (req, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        res.status(401).json(errorResponse('INVALID_CREDENTIALS', 'Invalid email or password'));
        return;
      }
      
      // Verify password
      const isValid = await User.verifyPassword(user, password);
      if (!isValid) {
        res.status(401).json(errorResponse('INVALID_CREDENTIALS', 'Invalid email or password'));
        return;
      }
      
      // Update streak
      await User.updateStreak(user.id);
      
      // Get updated user
      const updatedUser = await User.findById(user.id);
      
      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });
      
      res.json(successResponse({
        user: User.toPublicUser(updatedUser!),
        token,
      }));
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(errorResponse('SERVER_ERROR', 'Login failed'));
    }
  }
);

// Get current user profile
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json(errorResponse('NOT_FOUND', 'User not found'));
      return;
    }
    
    res.json(successResponse(User.toPublicUser(user)));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to get profile'));
  }
});

// Complete onboarding
router.post('/complete-onboarding', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await User.completeOnboarding(req.user!.userId);
    
    // Award XP for completing onboarding
    const xpResult = await User.addXp(req.user!.userId, 100);
    
    res.json(successResponse({
      xpEarned: 100,
      ...xpResult,
    }, 'Onboarding completed!'));
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json(errorResponse('SERVER_ERROR', 'Failed to complete onboarding'));
  }
});

export default router;
