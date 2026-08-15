import { loginSchema, passwordResetSchema, signUpSchema } from './auth-form.schema';

describe('auth form schemas', () => {
  it('normalizes a valid login email', () => {
    expect(
      loginSchema.parse({ email: '  USER@example.com ', password: '123456' }),
    ).toEqual({
      email: 'USER@example.com',
      password: '123456',
    });
  });

  it('rejects short passwords', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a sign-up when password confirmation differs', () => {
    const result = signUpSchema.safeParse({
      email: 'user@example.com',
      password: '123456',
      passwordConfirmation: '654321',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['passwordConfirmation']);
  });

  it('accepts a valid password reset request', () => {
    expect(passwordResetSchema.safeParse({ email: 'user@example.com' }).success).toBe(
      true,
    );
  });
});
