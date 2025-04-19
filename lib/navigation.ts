/**
 * Utility functions for more reliable navigation in Next.js
 */

/**
 * Navigate to a path using the most reliable method available
 * This bypasses Next.js router for critical navigation paths
 */
export function navigateTo(path: string): void {
  console.log(`Navigating to: ${path}`);
  
  // Try several methods for maximum reliability
  try {
    // Method 1: Direct location.replace - most reliable
    window.location.replace(path);
  } catch (e) {
    console.error("Failed to navigate with location.replace, trying alternatives", e);
    
    try {
      // Method 2: Location href
      window.location.href = path;
    } catch (e2) {
      console.error("Failed to navigate with location.href, trying alternatives", e2);
      
      try {
        // Method 3: Use script injection as fallback
        const script = document.createElement('script');
        script.innerHTML = `window.location = '${path}';`;
        document.body.appendChild(script);
      } catch (e3) {
        console.error("All navigation methods failed", e3);
      }
    }
  }
}