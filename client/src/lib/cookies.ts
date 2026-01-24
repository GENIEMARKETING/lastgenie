/**
 * Cookie utility functions for age verification and general cookie management
 */

const AGE_VERIFICATION_COOKIE_NAME = 'ageVerified';
const COOKIE_EXPIRATION_DAYS = 30;

/**
 * Set age verification cookie
 * @param value - Cookie value (typically 'true' or timestamp)
 */
export function setAgeVerificationCookie(value: string = 'true'): void {
  const expirationDate = new Date();
  expirationDate.setTime(expirationDate.getTime() + COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  
  const expires = expirationDate.toUTCString();
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Set cookie with appropriate flags
  document.cookie = `${AGE_VERIFICATION_COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax${isProduction ? '; Secure' : ''}`;
}

/**
 * Get age verification cookie value
 * @returns Cookie value or null if not found
 */
export function getAgeVerificationCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const name = AGE_VERIFICATION_COOKIE_NAME + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  
  return null;
}

/**
 * Check if age verification cookie exists and is valid
 * @returns true if cookie exists and is not expired
 */
export function hasValidAgeVerificationCookie(): boolean {
  const cookieValue = getAgeVerificationCookie();
  return cookieValue !== null && cookieValue !== '';
}

/**
 * Clear age verification cookie
 */
export function clearAgeVerificationCookie(): void {
  document.cookie = `${AGE_VERIFICATION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Get any cookie by name
 * @param name - Cookie name to retrieve
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const nameEQ = name + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  
  return null;
}

/**
 * Set any cookie with expiration
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Number of days until expiration
 */
export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  
  document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Lax${secureFlag}`;
}
