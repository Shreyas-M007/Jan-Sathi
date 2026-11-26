import crypto from "crypto";
import pool from "./db";

export type UserRole = "Citizen" | "Admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  createdAt: string;
};

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password.trim()).digest("hex");
}

export async function authenticateUser(emailInput: string, passwordInput: string, requestedRole: UserRole) {
  const normalizedEmail = emailInput.trim().toLowerCase();
  
  const [rows] = await pool.query<any[]>(
    "SELECT id, name, email, password_hash, role, department, created_at FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );

  const user = rows[0];

  if (!user) {
    return {
      success: false as const,
      error: "No account found with this email. Please create an account first."
    };
  }

  const inputHash = hashPassword(passwordInput);
  if (user.password_hash !== inputHash) {
    return {
      success: false as const,
      error: "Incorrect password. Please verify your credentials."
    };
  }

  if (user.role !== requestedRole) {
    return {
      success: false as const,
      error: `Access denied: This account is registered as '${user.role}'. Please select '${user.role}' access level to sign in.`
    };
  }

  const sanitized: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    createdAt: new Date(user.created_at).toISOString()
  };

  return {
    success: true as const,
    user: sanitized
  };
}

export async function registerUser(nameInput: string, emailInput: string, passwordInput: string, role: UserRole) {
  const name = nameInput.trim();
  const normalizedEmail = emailInput.trim().toLowerCase();

  if (!name || name.length < 2) {
    return {
      success: false as const,
      error: "Please enter a valid full name (minimum 2 characters)."
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      success: false as const,
      error: "Please enter a valid email address."
    };
  }

  if (!passwordInput || passwordInput.length < 6) {
    return {
      success: false as const,
      error: "Password must be at least 6 characters long."
    };
  }

  const [existingRows] = await pool.query<any[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail]
  );

  if (existingRows.length > 0) {
    return {
      success: false as const,
      error: "An account with this email already exists. Please sign in instead."
    };
  }

  const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = hashPassword(passwordInput);
  const department = role === "Admin" ? "Municipal Operations" : null;

  await pool.query(
    "INSERT INTO users (id, name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, name, normalizedEmail, passwordHash, role, department]
  );

  const sanitized: AuthUser = {
    id: userId,
    name,
    email: normalizedEmail,
    role,
    department: department || undefined,
    createdAt: new Date().toISOString()
  };

  return {
    success: true as const,
    user: sanitized
  };
}

export async function findUserById(id: string) {
  const [rows] = await pool.query<any[]>(
    "SELECT id, name, email, role, department, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  const user = rows[0];
  if (!user) return null;

  const sanitized: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    createdAt: new Date(user.created_at).toISOString()
  };
  return sanitized;
}
