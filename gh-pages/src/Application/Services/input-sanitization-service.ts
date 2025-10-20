export interface SanitizationResult {
  isValid: boolean;
  sanitizedValue: string;
  errorMessage?: string;
}

export interface ValidationOptions {
  allowEmpty?: boolean;
  maxLength?: number;
  minLength?: number;
  customPattern?: RegExp;
}

/**
 * Service responsible for sanitizing and validating user input to prevent XSS and code injection attacks.
 * This service should be used for all user-provided data that flows into code templates.
 */
export class InputSanitizationService {
  /**
   * Sanitize user input to prevent XSS and code injection attacks
   * @param input - Raw user input
   * @returns Sanitized string safe for use in code templates
   */
  sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove all HTML tags and special characters
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>&'"]/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/\p{C}/gu, '') // Remove control characters using Unicode property
      .trim();
  }

  /**
   * Validate that input is a valid TypeScript identifier
   * @param input - Input string (should be sanitized first)
   * @returns True if valid identifier, false otherwise
   */
  isValidIdentifier(input: string): boolean {
    if (!input || input.length === 0) {
      return false;
    }

    // TypeScript identifier rules: letters, numbers, underscore, starts with letter or underscore
    const identifierRegex = /^[a-zA-Z_]\w*$/;
    return identifierRegex.test(input);
  }

  /**
   * Comprehensive validation for node names and entity names
   * @param input - Raw user input
   * @param options - Validation options
   * @returns Sanitization result with validation status
   */
  validateNodeName(
    input: string,
    options: ValidationOptions = {}
  ): SanitizationResult {
    const { allowEmpty = false, maxLength = 50, minLength = 1 } = options;

    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        sanitizedValue: '',
        errorMessage: 'Please provide a valid input',
      };
    }

    const sanitized = this.sanitizeInput(input);

    if (!sanitized && !allowEmpty) {
      return {
        isValid: false,
        sanitizedValue: '',
        errorMessage:
          'Please enter a valid name (letters, numbers, underscore only)',
      };
    }

    if (sanitized.length < minLength) {
      return {
        isValid: false,
        sanitizedValue: sanitized,
        errorMessage: `Name must be at least ${minLength} character(s) long`,
      };
    }

    if (sanitized.length > maxLength) {
      return {
        isValid: false,
        sanitizedValue: sanitized,
        errorMessage: `Name must be no more than ${maxLength} characters long`,
      };
    }

    if (!this.isValidIdentifier(sanitized)) {
      return {
        isValid: false,
        sanitizedValue: sanitized,
        errorMessage:
          'Name must be a valid identifier (letters, numbers, underscore only)',
      };
    }

    return {
      isValid: true,
      sanitizedValue: sanitized,
    };
  }

  /**
   * Sanitize JSON object properties that might contain user input
   * @param obj - Object to sanitize
   * @param fieldsToSanitize - Array of field names that should be sanitized
   * @returns Sanitized object
   */
  sanitizeObjectFields(obj: any, fieldsToSanitize: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = { ...obj };

    for (const field of fieldsToSanitize) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = this.sanitizeInput(sanitized[field]);
      } else if (Array.isArray(sanitized[field])) {
        sanitized[field] = sanitized[field].map((item: any) =>
          typeof item === 'string' ? this.sanitizeInput(item) : item
        );
      }
    }

    return sanitized;
  }

  /**
   * Validate JSON data structure for OnionConfig uploads
   * @param jsonData - Parsed JSON object
   * @returns Validation result
   */
  validateOnionConfigJson(jsonData: any): SanitizationResult {
    if (!jsonData || typeof jsonData !== 'object') {
      return {
        isValid: false,
        sanitizedValue: '',
        errorMessage: 'Invalid JSON format',
      };
    }

    // Fields that typically contain user-provided names
    const fieldsToSanitize = [
      'entities',
      'domainServices',
      'applicationServices',
      'projectName',
      'projectDescription',
    ];

    const sanitizedData = this.sanitizeObjectFields(jsonData, fieldsToSanitize);

    // Validate entity names if present
    if (sanitizedData.entities && Array.isArray(sanitizedData.entities)) {
      for (const entity of sanitizedData.entities) {
        if (typeof entity === 'string' && !this.isValidIdentifier(entity)) {
          return {
            isValid: false,
            sanitizedValue: JSON.stringify(sanitizedData),
            errorMessage: `Invalid entity name: "${entity}". Only letters, numbers, and underscores are allowed.`,
          };
        }
      }
    }

    // Validate service names
    const serviceArrays = ['domainServices', 'applicationServices'];
    for (const serviceType of serviceArrays) {
      if (
        sanitizedData[serviceType] &&
        Array.isArray(sanitizedData[serviceType])
      ) {
        for (const service of sanitizedData[serviceType]) {
          if (typeof service === 'string' && !this.isValidIdentifier(service)) {
            return {
              isValid: false,
              sanitizedValue: JSON.stringify(sanitizedData),
              errorMessage: `Invalid service name: "${service}". Only letters, numbers, and underscores are allowed.`,
            };
          }
        }
      }
    }

    return {
      isValid: true,
      sanitizedValue: JSON.stringify(sanitizedData),
    };
  }
}
