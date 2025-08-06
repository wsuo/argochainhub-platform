// 通用错误处理类型定义

export enum ErrorType {
  // 权限相关错误
  PERMISSION_COMPANY_NOT_ASSOCIATED = 'PERMISSION_COMPANY_NOT_ASSOCIATED',
  PERMISSION_INVALID_COMPANY_TYPE = 'PERMISSION_INVALID_COMPANY_TYPE',
  PERMISSION_ACCESS_DENIED = 'PERMISSION_ACCESS_DENIED',
  PERMISSION_ONLY_BUYER = 'PERMISSION_ONLY_BUYER',
  PERMISSION_ONLY_SUPPLIER = 'PERMISSION_ONLY_SUPPLIER',
  
  // 认证相关错误
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_LOGIN_REQUIRED = 'AUTH_LOGIN_REQUIRED',
  
  // 数据相关错误
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_EMPTY = 'DATA_EMPTY',
  DATA_INVALID_FORMAT = 'DATA_INVALID_FORMAT',
  DATA_EXPIRED = 'DATA_EXPIRED',
  
  // API相关错误
  API_ENDPOINT_NOT_FOUND = 'API_ENDPOINT_NOT_FOUND',
  
  // 网络相关错误
  NETWORK_CONNECTION_ERROR = 'NETWORK_CONNECTION_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR = 'NETWORK_SERVER_ERROR',
  
  // 业务逻辑错误
  BUSINESS_VALIDATION_ERROR = 'BUSINESS_VALIDATION_ERROR',
  BUSINESS_OPERATION_NOT_ALLOWED = 'BUSINESS_OPERATION_NOT_ALLOWED',
  BUSINESS_DEADLINE_PASSED = 'BUSINESS_DEADLINE_PASSED',
  BUSINESS_STATUS_INVALID = 'BUSINESS_STATUS_INVALID',
  
  // 通用错误
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ParsedError {
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  details?: string;
  statusCode?: number;
  originalError?: unknown;
  timestamp?: Date;
  businessContext?: string;
}

export interface ErrorActionConfig {
  type: 'button' | 'link';
  label: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  action: () => void;
  href?: string;
  external?: boolean;
}

export interface ErrorDisplayConfig {
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  showDetails?: boolean;
  actions?: ErrorActionConfig[];
  className?: string;
}

export interface BusinessErrorContext {
  module: string; // 业务模块：inquiry, product, sample, registration
  action?: string; // 具体操作：create, read, update, delete
  resourceId?: string; // 资源ID
  resourceType?: string; // 资源类型
}

// 错误消息模式匹配配置
export interface ErrorPattern {
  pattern: RegExp;
  errorType: ErrorType;
  severity: ErrorSeverity;
  extractParams?: string[]; // 从错误消息中提取的参数名
}

// HTTP状态码到错误类型的映射
export const HTTP_STATUS_ERROR_MAP: Record<number, ErrorType> = {
  400: ErrorType.BUSINESS_VALIDATION_ERROR,
  401: ErrorType.AUTH_UNAUTHORIZED,
  403: ErrorType.PERMISSION_ACCESS_DENIED,
  404: ErrorType.DATA_NOT_FOUND,
  408: ErrorType.NETWORK_TIMEOUT,
  409: ErrorType.BUSINESS_OPERATION_NOT_ALLOWED,
  422: ErrorType.DATA_INVALID_FORMAT,
  500: ErrorType.NETWORK_SERVER_ERROR,
  502: ErrorType.NETWORK_CONNECTION_ERROR,
  503: ErrorType.SYSTEM_MAINTENANCE,
  504: ErrorType.NETWORK_TIMEOUT,
};

// 权限错误消息模式
export const PERMISSION_ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /User must be associated with a company/i,
    errorType: ErrorType.PERMISSION_COMPANY_NOT_ASSOCIATED,
    severity: ErrorSeverity.HIGH
  },
  {
    pattern: /Invalid company type.*inquiry access/i,
    errorType: ErrorType.PERMISSION_INVALID_COMPANY_TYPE,
    severity: ErrorSeverity.HIGH
  },
  {
    pattern: /You do not have permission to access/i,
    errorType: ErrorType.PERMISSION_ACCESS_DENIED,
    severity: ErrorSeverity.MEDIUM
  },
  {
    pattern: /Only buyers can/i,
    errorType: ErrorType.PERMISSION_ONLY_BUYER,
    severity: ErrorSeverity.MEDIUM
  },
  {
    pattern: /Only.*supplier.*can/i,
    errorType: ErrorType.PERMISSION_ONLY_SUPPLIER,
    severity: ErrorSeverity.MEDIUM
  }
];

// 业务逻辑错误模式
export const BUSINESS_ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /deadline.*passed/i,
    errorType: ErrorType.BUSINESS_DEADLINE_PASSED,
    severity: ErrorSeverity.MEDIUM
  },
  {
    pattern: /Cannot.*inquiry with status/i,
    errorType: ErrorType.BUSINESS_STATUS_INVALID,
    severity: ErrorSeverity.MEDIUM
  },
  {
    pattern: /not found/i,
    errorType: ErrorType.DATA_NOT_FOUND,
    severity: ErrorSeverity.MEDIUM
  }
];

// API错误模式
export const API_ERROR_PATTERNS: ErrorPattern[] = [
  {
    pattern: /Cannot (GET|POST|PUT|DELETE|PATCH) \/api/i,
    errorType: ErrorType.API_ENDPOINT_NOT_FOUND,
    severity: ErrorSeverity.HIGH
  }
];

// 所有错误模式
export const ALL_ERROR_PATTERNS: ErrorPattern[] = [
  ...PERMISSION_ERROR_PATTERNS,
  ...BUSINESS_ERROR_PATTERNS,
  ...API_ERROR_PATTERNS
];