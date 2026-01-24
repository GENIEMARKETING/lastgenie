/**
 * Centralized redirect utility functions for authentication flows
 * Handles return URL validation, default redirects, and security measures
 */

/**
 * Default redirect destinations based on user context
 */
const DEFAULT_REDIRECTS = {
  AUTHENTICATED: '/account',
  UNAUTHENTICATED: '/',
  FALLBACK: '/',
} as const;

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/account',
  '/admin',
] as const;

/**
 * Routes that should redirect to home page after auth instead of staying on the same page
 */
const AUTH_PAGE_REDIRECTS = [
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
] as const;

/**
 * Validates if a return URL is safe to redirect to
 * Prevents open redirect vulnerabilities
 */
export function isValidReturnUrl(url: string): boolean {
  try {
    // Handle relative URLs (most common case)
    if (url.startsWith('/')) {
      // Ensure it's not a protocol-relative URL (//example.com)
      if (url.startsWith('//')) {
        return false;
      }
      // Valid relative URL
      return true;
    }

    // Handle absolute URLs - must be same origin
    const urlObj = new URL(url);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    
    return urlObj.origin === currentOrigin;
  } catch {
    // Invalid URL format
    return false;
  }
}

/**
 * Gets the current page path including search params
 */
export function getCurrentPath(): string {
  if (typeof window === 'undefined') {
    return '/';
  }
  
  return window.location.pathname + window.location.search;
}

/**
 * Determines if a route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  return PROTECTED_ROUTES.some(route => path.startsWith(route));
}

/**
 * Determines if a route is an auth page that should redirect to home after login
 */
export function isAuthPage(path: string): boolean {
  return AUTH_PAGE_REDIRECTS.some(route => path.startsWith(route));
}

/**
 * Gets the appropriate return URL for login redirect
 */
export function getReturnUrlForLogin(currentPath?: string): string {
  const path = currentPath || getCurrentPath();
  
  // Don't return to auth pages - redirect to default instead
  if (isAuthPage(path)) {
    return DEFAULT_REDIRECTS.AUTHENTICATED;
  }
  
  return path;
}

/**
 * Gets the default redirect destination after successful authentication
 */
export function getDefaultRedirect(returnUrl?: string | null): string {
  // If we have a valid return URL, use it
  if (returnUrl && isValidReturnUrl(returnUrl)) {
    return returnUrl;
  }
  
  // Otherwise use default authenticated redirect
  return DEFAULT_REDIRECTS.AUTHENTICATED;
}

/**
 * Creates a login URL with return URL parameter and optional intent
 */
export function createLoginUrl(returnUrl?: string, intent?: string): string {
  const baseUrl = '/login';
  const params = new URLSearchParams();
  
  // Add returnUrl if valid and not an auth page
  if (returnUrl && isValidReturnUrl(returnUrl) && !isAuthPage(returnUrl)) {
    params.set('returnUrl', returnUrl);
  }
  
  // Add intent if provided
  if (intent) {
    params.set('intent', intent);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Creates a signup URL with return URL parameter and optional intent
 */
export function createSignupUrl(returnUrl?: string, intent?: string): string {
  const baseUrl = '/signup';
  const params = new URLSearchParams();
  
  // Add returnUrl if valid and not an auth page
  if (returnUrl && isValidReturnUrl(returnUrl) && !isAuthPage(returnUrl)) {
    params.set('returnUrl', returnUrl);
  }
  
  // Add intent if provided
  if (intent) {
    params.set('intent', intent);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Handles redirect after successful authentication
 * Used by both login and signup flows
 */
export function handlePostAuthRedirect(
  router: { push: (url: string) => void },
  returnUrl?: string | null,
  intent?: string | null,
  fallbackUrl?: string
): void {
  let redirectUrl: string = fallbackUrl || DEFAULT_REDIRECTS.AUTHENTICATED;
  
  // Handle intent-specific redirects first
  if (intent) {
    redirectUrl = getIntentBasedRedirect(intent, returnUrl);
  } else if (returnUrl && isValidReturnUrl(returnUrl)) {
    // Use return URL if valid and no specific intent
    redirectUrl = returnUrl;
  }
  
  // Ensure we don't redirect to auth pages
  if (isAuthPage(redirectUrl)) {
    redirectUrl = DEFAULT_REDIRECTS.AUTHENTICATED;
  }
  
  router.push(redirectUrl);
}

/**
 * Gets appropriate redirect URL for protected route access
 */
export function getProtectedRouteRedirect(currentPath: string, intent?: string): string {
  const returnUrl = getReturnUrlForLogin(currentPath);
  return createLoginUrl(returnUrl, intent);
}

/**
 * Utility to extract return URL from search params
 */
export function extractReturnUrl(searchParams: URLSearchParams): string | null {
  const returnUrl = searchParams.get('returnUrl');
  
  if (!returnUrl) {
    return null;
  }
  
  // Validate the return URL
  if (!isValidReturnUrl(returnUrl)) {
    console.warn('Invalid return URL detected:', returnUrl);
    return null;
  }
  
  return returnUrl;
}

/**
 * Utility to extract intent from search params
 */
export function extractIntent(searchParams: URLSearchParams): string | null {
  return searchParams.get('intent');
}

/**
 * Gets redirect URL based on intent
 */
export function getIntentBasedRedirect(intent: string, returnUrl?: string | null): string {
  switch (intent) {
    case 'checkout':
      // For checkout intent, return to cart or the specified return URL
      return (returnUrl && isValidReturnUrl(returnUrl)) ? returnUrl : '/cart';
    
    case 'affiliate':
      // For affiliate intent, go to affiliate application page
      return '/account/affiliate';
    
    case 'admin':
      // For admin intent, go to admin dashboard
      return '/admin';
    
    default:
      // For unknown intents, use return URL or default
      return (returnUrl && isValidReturnUrl(returnUrl)) ? returnUrl : DEFAULT_REDIRECTS.AUTHENTICATED;
  }
}

/**
 * Handles redirect for authenticated users trying to access auth pages
 */
export function handleAuthenticatedUserRedirect(
  router: { push: (url: string) => void },
  returnUrl?: string | null,
  intent?: string | null
): void {
  let redirectUrl: string = DEFAULT_REDIRECTS.AUTHENTICATED;
  
  // Handle intent-specific redirects first
  if (intent) {
    redirectUrl = getIntentBasedRedirect(intent, returnUrl);
  } else if (returnUrl && isValidReturnUrl(returnUrl) && !isAuthPage(returnUrl)) {
    // Use return URL if valid and not an auth page
    redirectUrl = returnUrl;
  }
  
  router.push(redirectUrl);
}

/**
 * Smart redirect logic based on user context and current page
 */
export function getSmartRedirect(
  currentPath: string,
  isAuthenticated: boolean,
  returnUrl?: string | null
): string {
  // If we have a valid return URL, use it
  if (returnUrl && isValidReturnUrl(returnUrl) && !isAuthPage(returnUrl)) {
    return returnUrl;
  }
  
  // If user is on an auth page, redirect to appropriate default
  if (isAuthPage(currentPath)) {
    return isAuthenticated ? DEFAULT_REDIRECTS.AUTHENTICATED : DEFAULT_REDIRECTS.UNAUTHENTICATED;
  }
  
  // If it's a protected route and user is not authenticated, redirect to login
  if (isProtectedRoute(currentPath) && !isAuthenticated) {
    return createLoginUrl(currentPath);
  }
  
  // For public pages, stay on the same page or go to appropriate default
  if (isAuthenticated) {
    return currentPath.startsWith('/') ? currentPath : DEFAULT_REDIRECTS.AUTHENTICATED;
  }
  
  return currentPath.startsWith('/') ? currentPath : DEFAULT_REDIRECTS.UNAUTHENTICATED;
}