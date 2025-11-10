// src/app/interfaces/user.ts
export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  token: string;
  createdAt?: string;  // Make optional for now
  updatedAt?: string;  // Make optional for now
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role?: string;
}