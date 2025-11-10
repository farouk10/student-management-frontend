export interface ChatUser {
    userId: string;
    nom: string;
    prenom: string;
    role: string;
    email: string;
  }
  
  export interface ChatMessage {
    _id: string;
    user: ChatUser;
    message: string;
    room: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PaginatedChatMessages {
    messages: ChatMessage[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }