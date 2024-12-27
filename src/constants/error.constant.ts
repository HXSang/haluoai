import { HttpStatus } from '@nestjs/common';

export const Errors = {
  TOO_MANY_REQUESTS: {
    message: 'Too many requests',
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    errorCode: 'CO01',
  },
  DEFAULT: {
    message: 'An error occurred. Please try again later',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 'CO02',
  },
  INVALID_INPUT: {
    message: 'Invalid input. Please check your input data',
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'CO03',
  },
  RESOURCE_NOT_FOUND: {
    message: 'The requested resource was not found',
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'CO04',
  },
  UPLOAD_FILE_FAILED: {
    message: 'There was an error with the uploading of the file. Please try again later',
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: 'CO05',
  },
  VALIDATION_ERROR: {
    message: 'Validation failed. Please check your input data',
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: 'CO06',
  },
  AUTH: {
    ROLE_NOT_PERMIT: {
      message: 'This user role is not permitted in our system!',
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'AU01',
    },
    EMAIL_EXISTED: {
      message: 'This email already exists',
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'AU02',
    },
    EXPIRED_TOKEN: {
      message: 'Token has expired',
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: 'AU03',
    },
    INVALID_TOKEN: {
      message: 'Invalid token in request',
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: 'AU04',
    },
    INVALID_REFRESH_TOKEN: {
      message: 'Invalid refresh token in request',
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: 'AU05',
    },
    INVALID_ROLE: {
      message: 'One or more of the provided role IDs are invalid',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: 'AU06',
    },
    WRONG_CREDENTIALS: {
      message: 'Incorrect email or password',
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: 'AU07',
    },
    WRONG_EMAIL: {
      message: 'Incorrect email',
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: 'AU08',
    },
    USER_NOT_FOUND: {
      message: 'User not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'AU09',
    },
    USER_ARCHIVED: {
      message: 'Your account has been locked',
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'AU10',
    },
  },
  ROLE: {
    ROLE_NAME_EXISTS: {
      message: 'The provided role name already exists',
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'R01',
    },
    PERMISSION_NOT_FOUND: {
      message: 'Permission not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'Ro2',
    },
    ROLE_NOT_FOUND: {
      message: 'Role not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'R03',
    },
  },
  CLIENT: {
    CLIENT_NOT_FOUND: {
      message: 'Client not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'C01',
    },
  },
  TAG: {
    TAG_INVALID: {
      message: 'Tag is invalid',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: 'CO01',
    },
    TAG_EXIST: {
      message: 'Tag already exists',
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'CO02',
    },
  },
  CATEGORY: {
    CATEGORY_INVALID: {
      message: 'Category is invalid',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: 'CO01',
    },
    CATEGORY_NOT_FOUND: {
      message: 'Category not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'CO02',
    },
    CATEGORY_EXIST: {
      message: 'Category already exists',
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'CO03',
    },
  },
  CLIENT_OPTION: {
    INDUSTRY_NOT_FOUND: {
      message: 'Industry not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'CO01',
    },
    SIZE_NOT_FOUND: {
      message: 'Size not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'CO02',
    },
    BUDGET_NOT_FOUND: {
      message: 'Budget not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'CO03',
    },
    INDUSTRY_INVALID: {
      message: 'Industry is invalid',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: 'CO01',
    },
    SIZE_INVALID: {
      message: 'Size is invalid',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: 'CO02',
    },
    BUDGET_INVALID: {
      message: 'Budget is invalid',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: 'CO03',
    },
    STATUS_INVALID: {
      message: 'Status is invalid',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: 'CO04',
    },
  },
  APPLICATION: {
    APPLICATION_NOT_FOUND: {
      message: 'Application not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'AP01',
    },
    CANDIDATE_ALREADY_APPLIED: {
      message: 'Candidate already applied this job',
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'AP02',
    },
  },
  CANDIDATE: {
    CANDIDATE_NOT_FOUND: {
      message: 'Candidate not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'CA01',
    },
    CANDIDATE_ACCESS_FORBIDDEN: {
      message: 'Access forbidden',
      statusCode: HttpStatus.FORBIDDEN,
      errorCode: 'CA02',
    },
    CANDIDATE_INVALID: {
      message: 'Candidate is invalid',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errorCode: 'CA03',
    },
    CANDIDATE_EXISTED: {
      message: 'Candidate already exists',
      statusCode: HttpStatus.CONFLICT,
      errorCode: 'CA04',
    },
  },
  JOB: {
    JOB_NOT_FOUND: {
      message: 'Job not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'JO01',
    },
  },
  JOB_OPTION: {
    PRIORITY_NOT_FOUND: {
      message: 'Priority not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'JO01',
    },
  },
  RESUME: {
    RESUME_NOT_FOUND: {
      message: 'Resume not found',
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: 'RE01',
    },
  },
};
