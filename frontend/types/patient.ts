export type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  phone: string;
  email: string;
  profession: string;
  shoe_size: string | null;
  referring_doctor: string;
  address: string;
  allergies: string;
  medical_background: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PatientInput = Omit<
  Patient,
  "id" | "created_at" | "updated_at" | "is_active"
>;

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type ConsultationNote = {
  id: string;
  patient: string;
  appointment: string | null;
  practitioner: string | null;
  consultation_date: string;
  motif: string;
  bilan_podologique: string;
  diagnostic: string;
  treatment_plan: string;
  created_at: string;
};
