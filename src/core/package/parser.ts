import { LeaguePackage } from './schema';
import { validatePackage, validateSchemaVersion, validateUrl, ValidationResult } from './validator';

export interface ParseResult {
  success: boolean;
  package?: LeaguePackage;
  errors?: string[];
  validationResult?: ValidationResult;
}

export async function fetchPackage(url: string): Promise<ParseResult> {
  if (!validateUrl(url)) {
    return {
      success: false,
      errors: ['Invalid URL. Only http and https protocols are allowed.'],
    };
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        success: false,
        errors: [`Failed to fetch package: ${response.status} ${response.statusText}`],
      };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return {
        success: false,
        errors: ['Package must be a JSON file.'],
      };
    }

    const data = await response.json();
    return parsePackage(data);
  } catch (error) {
    return {
      success: false,
      errors: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

export function parsePackage(data: unknown): ParseResult {
  const validationResult = validatePackage(data);

  if (!validationResult.valid) {
    return {
      success: false,
      errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
      validationResult,
    };
  }

  const pkg = data as LeaguePackage;

  if (!validateSchemaVersion(pkg.schemaVersion)) {
    return {
      success: false,
      errors: [`Unsupported schema version: ${pkg.schemaVersion}. Only version 1.x is supported.`],
      validationResult,
    };
  }

  return {
    success: true,
    package: pkg,
    validationResult,
  };
}

export function parsePackageFromString(jsonString: string): ParseResult {
  try {
    const data = JSON.parse(jsonString);
    return parsePackage(data);
  } catch (error) {
    return {
      success: false,
      errors: ['Invalid JSON format. Please check your JSON syntax.'],
    };
  }
}
