export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  userId: string;
  priority: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
