/**
 * Utility functions for more reliable navigation in Next.js
 */

/**
 * Navigate to a path using Next.js router with fallbacks
 * @param path The path to navigate to
 * @param router Optional Next.js router instance (if available)
 */
export function navigateTo(path: string, router?: any): void {
  console.log(`Navigating to: ${path}`);
  
  // Try Next.js router first if provided
  if (router) {
    try {
      router.push(path);
      return;
    } catch (e) {
      console.error("Failed to navigate with Next.js router, trying alternatives", e);
    }
  }
  
  // Fallback methods if router fails or isn't available
  try {
    // Method 1: window.location with replace
    window.location.href = path;
  } catch (e) {
    console.error("Failed to navigate with location.href, trying alternatives", e);
    
    try {
      // Method 2: Use location.replace as fallback
      window.location.replace(path);
    } catch (e2) {
      console.error("All navigation methods failed", e2);
    }
  }
}