export interface Etudiant {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  matiere: string[];
  photo?: string;        // ✅ add this line
  createdAt?: string;  // Make optional for now
  updatedAt?: string;  // Make optional for now

}

export interface EtudiantCreate {
  nom: string;
  prenom: string;
  email: string;
  matiere: string[];
}

// Add pagination response interface
export interface PaginatedResponse<T> {
  etudiants: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}