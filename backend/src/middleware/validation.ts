import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { errorResponse } from '../utils/helpers';

// Validation middleware wrapper
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json(errorResponse(
        'VALIDATION_ERROR',
        'Validation failed',
        errors.array().map(err => ({
          field: 'path' in err ? err.path : 'unknown',
          message: err.msg,
        }))
      ));
      return;
    }
    
    next();
  };
}
