/**
 * Cleans and validates a UUID string, ensuring it's safe for URL usage
 * @param id The UUID string to clean
 * @returns The cleaned UUID string or null if invalid
 */
export function cleanUUID(id: string): string | null {
  if (!id) return null;
  
  try {
    // First decode the ID in case it's already encoded
    let decodedId = id;
    try {
      decodedId = decodeURIComponent(id);
    } catch (e) {
      console.warn('Warning: ID was not URL encoded:', e);
      // Continue with original ID if decoding fails
    }
    
    // Remove any trailing characters after the UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = decodedId.match(uuidPattern);
    
    if (!match) {
      console.warn('Warning: ID does not match UUID pattern:', decodedId);
      return null;
    }
    
    // Return the cleaned UUID
    return match[0];
  } catch (e) {
    console.error('Error cleaning UUID:', e);
    return null;
  }
} 