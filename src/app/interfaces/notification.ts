import { Etudiant } from "./etudiant";

export interface AppNotification {
  id: string;
  type: 'etudiant_created' | 'etudiant_updated' | 'etudiant_deleted';
  message: string;
  performedBy: {
    nom: string;
    prenom: string;
    role: string;
  };
  target: {
    nom: string;
    prenom: string;
  };
  timestamp: number;
  expiresAt: number;
}

export interface NotificationStorage {
  notifications: AppNotification[];
  lastCleanup: number;
}

export interface EtudiantWithAction extends Etudiant {
  performedBy?: {
    nom: string;
    prenom: string;
    role: string;
    email: string;
  };
}

export interface DeletePayload {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  performedBy: {
    nom: string;
    prenom: string;
    role: string;
    email: string;
  };
}
