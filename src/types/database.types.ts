export type UserType = 'client' | 'queuer' | 'admin';

export type ReservationStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  city?: string;
  phone?: string;
  description?: string;
  user_type: UserType;
  is_active?: boolean;
  is_admin?: boolean;
  is_verified?: boolean;
  speciality?: string;
  rate_per_hour?: number;
  rating?: number;
  completed_queues?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string;
  created_at?: string;
}

export interface Reservation {
  id: string;
  created_at: string;
  client_id: string;
  queuer_id: string;
  service_id: string;
  date: string;
  status: ReservationStatus;
  client_rating?: number | null;
  client_review?: string | null;
  total_amount?: number | null;
  queuer_notes?: string | null;
  profiles?: Profile; // El perfil del cliente
  services?: Service; // El servicio reservado
  ['profiles!reservations_queuer_id_fkey']?: Profile; // Otra forma de acceder al perfil del representante
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface QueuerService {
  id: string;
  queuer_id: string;
  service_id: string;
  price?: number;
  created_at?: string;
  service?: Service;
} 