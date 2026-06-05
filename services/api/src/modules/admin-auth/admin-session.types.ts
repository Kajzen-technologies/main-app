export interface AdminSession {
  id: string;
  email: string;
  role: "ADMIN";
  createdAt: string;
  expiresAt: string;
}
