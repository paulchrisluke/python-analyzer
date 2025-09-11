import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a secure random password for testing
 * @param length - Password length (default: 16)
 * @returns Secure random password with guaranteed character classes
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  
  // Pre-seed one character from each required class
  const requiredChars = ['A', 'a', '1', '!']; // uppercase, lowercase, digit, symbol
  const remainingLength = length - requiredChars.length;
  
  // Generate random characters for the remaining positions
  const randomChars: string[] = [];
  for (let i = 0; i < remainingLength; i++) {
    randomChars.push(charset[bytes[i] % charset.length]);
  }
  
  // Combine required chars and random chars
  const allChars = [...requiredChars, ...randomChars];
  
  // Shuffle the combined array using the same random bytes
  for (let i = allChars.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
  }
  
  return allChars.join('');
}
