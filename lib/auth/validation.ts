export type ValidationResult = { valid: boolean; error?: string };

export type PasswordValidationResult = { valid: boolean; error?: string };

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return { valid: false, error: "Email address is required" };
  if (email.length > 254) return { valid: false, error: "Email is too long" };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return { valid: false, error: "Please enter a valid email address" };
  return { valid: true };
}

export function validatePasswords(
  password: string,
  confirm: string
): PasswordValidationResult {
  if (password.length < 6)
    return { valid: false, error: "Password must be at least 6 characters" };
  if (password.length > 128)
    return { valid: false, error: "Password must not exceed 128 characters" };
  if (password !== confirm)
    return { valid: false, error: "Passwords do not match" };
  return { valid: true };
}
