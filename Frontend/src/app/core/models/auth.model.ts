// Purpose: Authentication and authorization models.
// Matches backend AuthController, LoginRequest.java, RegisterRequest.java and JwtUtil.java claims.

export interface LoginRequest {
  username?: string;
  usernameOrEmail?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type?: string;
  username?: string;
  role?: string;
  userId?: number;
}

export interface JwtPayload {
  id: number;
  sub: string;
  role: string;
  exp?: number;
  iat?: number;
}
