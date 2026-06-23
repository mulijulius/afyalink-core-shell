export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          facility: string
          full_name: string
          id: string
          phone: string | null
          requested_role: Database["public"]["Enums"]["app_role"] | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          facility?: string
          full_name?: string
          id: string
          phone?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          facility?: string
          full_name?: string
          id?: string
          phone?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"] | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          national_id: string
          full_name: string
          dob: string
          gender: Database["public"]["Enums"]["gender"]
          phone: string | null
          county: string | null
          sub_county: string | null
          blood_group: string | null
          allergies: string[]
          nhif_no: string | null
          nok_name: string | null
          nok_phone: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          national_id: string
          full_name: string
          dob: string
          gender: Database["public"]["Enums"]["gender"]
          phone?: string | null
          county?: string | null
          sub_county?: string | null
          blood_group?: string | null
          allergies?: string[]
          nhif_no?: string | null
          nok_name?: string | null
          nok_phone?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          national_id?: string
          full_name?: string
          dob?: string
          gender?: Database["public"]["Enums"]["gender"]
          phone?: string | null
          county?: string | null
          sub_county?: string | null
          blood_group?: string | null
          allergies?: string[]
          nhif_no?: string | null
          nok_name?: string | null
          nok_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          id: string
          patient_id: string
          visit_date: string
          diagnosis: string | null
          notes: string | null
          clinician_id: string | null
          clinician_name: string | null
          department: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          visit_date?: string
          diagnosis?: string | null
          notes?: string | null
          clinician_id?: string | null
          clinician_name?: string | null
          department?: string
          created_at?: string
        }
        Update: {
          visit_date?: string
          diagnosis?: string | null
          notes?: string | null
          clinician_id?: string | null
          clinician_name?: string | null
          department?: string
        }
        Relationships: [{ foreignKeyName: "visits_patient_id_fkey"; columns: ["patient_id"]; referencedRelation: "patients"; referencedColumns: ["id"] }]
      }
      opd_queue: {
        Row: {
          id: string
          queue_no: string
          patient_id: string | null
          patient_name: string
          check_in_time: string
          triage: Database["public"]["Enums"]["triage_level"]
          assigned_to: string | null
          status: Database["public"]["Enums"]["queue_status"]
          checked_in_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          queue_no: string
          patient_id?: string | null
          patient_name: string
          check_in_time?: string
          triage?: Database["public"]["Enums"]["triage_level"]
          assigned_to?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          checked_in_by?: string | null
          updated_at?: string
        }
        Update: {
          queue_no?: string
          patient_name?: string
          triage?: Database["public"]["Enums"]["triage_level"]
          assigned_to?: string | null
          status?: Database["public"]["Enums"]["queue_status"]
          updated_at?: string
        }
        Relationships: []
      }
      lab_orders: {
        Row: {
          id: string
          order_no: string
          patient_id: string | null
          patient_name: string
          national_id: string | null
          tests: string[]
          ordered_by: string | null
          ordered_by_name: string | null
          priority: Database["public"]["Enums"]["lab_priority"]
          status: Database["public"]["Enums"]["lab_order_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_no: string
          patient_id?: string | null
          patient_name: string
          national_id?: string | null
          tests: string[]
          ordered_by?: string | null
          ordered_by_name?: string | null
          priority?: Database["public"]["Enums"]["lab_priority"]
          status?: Database["public"]["Enums"]["lab_order_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: Database["public"]["Enums"]["lab_order_status"]
          updated_at?: string
        }
        Relationships: []
      }
      lab_results: {
        Row: {
          id: string
          order_id: string
          test_name: string
          result: string
          reference_range: string | null
          flag: Database["public"]["Enums"]["result_flag"]
          is_critical: boolean
          verified_by: string | null
          verified_by_name: string | null
          sample_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          test_name: string
          result: string
          reference_range?: string | null
          flag?: Database["public"]["Enums"]["result_flag"]
          is_critical?: boolean
          verified_by?: string | null
          verified_by_name?: string | null
          sample_id?: string | null
          created_at?: string
        }
        Update: {
          result?: string
          flag?: Database["public"]["Enums"]["result_flag"]
          is_critical?: boolean
          verified_by?: string | null
          verified_by_name?: string | null
        }
        Relationships: [{ foreignKeyName: "lab_results_order_id_fkey"; columns: ["order_id"]; referencedRelation: "lab_orders"; referencedColumns: ["id"] }]
      }
      pharmacy_drugs: {
        Row: {
          id: string
          name: string
          category: string
          stock: number
          unit: string
          reorder_level: number
          expiry_date: string | null
          supplier: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          stock?: number
          unit?: string
          reorder_level?: number
          expiry_date?: string | null
          supplier?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          stock?: number
          reorder_level?: number
          expiry_date?: string | null
          supplier?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          visit_id: string | null
          patient_id: string | null
          patient_name: string
          drug_id: string | null
          drug_name: string
          dose: string
          quantity: string
          prescribed_by: string | null
          prescribed_by_name: string | null
          dispensed: boolean
          dispensed_by: string | null
          dispensed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          visit_id?: string | null
          patient_id?: string | null
          patient_name: string
          drug_id?: string | null
          drug_name: string
          dose: string
          quantity: string
          prescribed_by?: string | null
          prescribed_by_name?: string | null
          dispensed?: boolean
          dispensed_by?: string | null
          dispensed_at?: string | null
          created_at?: string
        }
        Update: {
          dispensed?: boolean
          dispensed_by?: string | null
          dispensed_at?: string | null
        }
        Relationships: []
      }
      billing_transactions: {
        Row: {
          id: string
          receipt_no: string
          patient_id: string | null
          patient_name: string
          visit_id: string | null
          amount: number
          method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["payment_status"]
          items: Json
          recorded_by: string | null
          transaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          receipt_no: string
          patient_id?: string | null
          patient_name: string
          visit_id?: string | null
          amount: number
          method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["payment_status"]
          items?: Json
          recorded_by?: string | null
          transaction_date?: string
          created_at?: string
        }
        Update: {
          status?: Database["public"]["Enums"]["payment_status"]
          items?: Json
        }
        Relationships: []
      }
      nhif_claims: {
        Row: {
          id: string
          claim_no: string
          patient_id: string | null
          patient_name: string
          visit_id: string | null
          amount: number
          visit_date: string
          submitted_date: string
          status: Database["public"]["Enums"]["claim_status"]
          rejection_reason: string | null
          submitted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          claim_no: string
          patient_id?: string | null
          patient_name: string
          visit_id?: string | null
          amount: number
          visit_date: string
          submitted_date?: string
          status?: Database["public"]["Enums"]["claim_status"]
          rejection_reason?: string | null
          submitted_by?: string | null
          created_at?: string
        }
        Update: {
          status?: Database["public"]["Enums"]["claim_status"]
          rejection_reason?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          ref_no: string
          patient_id: string | null
          patient_name: string
          national_id: string | null
          sent_to: string
          urgency: Database["public"]["Enums"]["referral_urgency"]
          status: Database["public"]["Enums"]["referral_status"]
          reason: string
          outcome: string | null
          referred_by: string | null
          referred_by_name: string | null
          date_sent: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ref_no: string
          patient_id?: string | null
          patient_name: string
          national_id?: string | null
          sent_to: string
          urgency?: Database["public"]["Enums"]["referral_urgency"]
          status?: Database["public"]["Enums"]["referral_status"]
          reason: string
          outcome?: string | null
          referred_by?: string | null
          referred_by_name?: string | null
          date_sent?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: Database["public"]["Enums"]["referral_status"]
          outcome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vitals_observations: {
        Row: {
          id: string
          patient_id: string
          visit_id: string | null
          recorded_by: string | null
          recorded_by_name: string | null
          temperature_c: number | null
          pulse_bpm: number | null
          resp_rate: number | null
          bp_systolic: number | null
          bp_diastolic: number | null
          spo2_percent: number | null
          weight_kg: number | null
          height_cm: number | null
          chief_complaint: string | null
          symptoms: string[]
          signs: string | null
          notes: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          visit_id?: string | null
          recorded_by?: string | null
          recorded_by_name?: string | null
          temperature_c?: number | null
          pulse_bpm?: number | null
          resp_rate?: number | null
          bp_systolic?: number | null
          bp_diastolic?: number | null
          spo2_percent?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          chief_complaint?: string | null
          symptoms?: string[]
          signs?: string | null
          notes?: string | null
          recorded_at?: string
        }
        Update: {
          temperature_c?: number | null
          pulse_bpm?: number | null
          resp_rate?: number | null
          bp_systolic?: number | null
          bp_diastolic?: number | null
          spo2_percent?: number | null
          weight_kg?: number | null
          height_cm?: number | null
          chief_complaint?: string | null
          symptoms?: string[]
          signs?: string | null
          notes?: string | null
        }
        Relationships: [
          { foreignKeyName: "vitals_observations_patient_id_fkey"; columns: ["patient_id"]; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "vitals_observations_visit_id_fkey"; columns: ["visit_id"]; referencedRelation: "visits"; referencedColumns: ["id"] },
        ]
      }
      diagnoses: {
        Row: {
          id: string
          patient_id: string
          visit_id: string | null
          diagnosis: string
          diagnosis_type: string
          icd10_code: string | null
          notes: string | null
          diagnosed_by: string | null
          diagnosed_by_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          visit_id?: string | null
          diagnosis: string
          diagnosis_type?: string
          icd10_code?: string | null
          notes?: string | null
          diagnosed_by?: string | null
          diagnosed_by_name?: string | null
          created_at?: string
        }
        Update: {
          diagnosis?: string
          diagnosis_type?: string
          icd10_code?: string | null
          notes?: string | null
        }
        Relationships: [
          { foreignKeyName: "diagnoses_patient_id_fkey"; columns: ["patient_id"]; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "diagnoses_visit_id_fkey"; columns: ["visit_id"]; referencedRelation: "visits"; referencedColumns: ["id"] },
        ]
      }
      medical_history: {
        Row: {
          id: string
          patient_id: string
          category: string
          description: string
          onset_date: string | null
          status: string
          recorded_by: string | null
          recorded_by_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          category?: string
          description: string
          onset_date?: string | null
          status?: string
          recorded_by?: string | null
          recorded_by_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          category?: string
          description?: string
          onset_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "medical_history_patient_id_fkey"; columns: ["patient_id"]; referencedRelation: "patients"; referencedColumns: ["id"] },
        ]
      }
      clinical_summaries: {
        Row: {
          id: string
          patient_id: string
          visit_id: string | null
          summary: string
          authored_by: string | null
          authored_by_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          visit_id?: string | null
          summary: string
          authored_by?: string | null
          authored_by_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          summary?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "clinical_summaries_patient_id_fkey"; columns: ["patient_id"]; referencedRelation: "patients"; referencedColumns: ["id"] },
          { foreignKeyName: "clinical_summaries_visit_id_fkey"; columns: ["visit_id"]; referencedRelation: "visits"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "Clinician"
        | "Nurse"
        | "Pharmacist"
        | "Lab Technician"
        | "Admin"
        | "Finance Officer"
        | "Doctor"
      profile_status: "pending" | "approved" | "rejected"
      gender: "Male" | "Female"
      triage_level: "Red" | "Orange" | "Yellow" | "Green" | "Blue"
      queue_status: "Waiting" | "Triaged" | "In Consult" | "Done" | "Did Not Wait"
      lab_priority: "Routine" | "Urgent" | "STAT"
      lab_order_status: "Pending" | "Collected" | "Processing" | "Completed"
      result_flag: "Normal" | "High" | "Low"
      payment_method: "M-Pesa" | "NHIF" | "Cash" | "Insurance"
      payment_status: "Paid" | "Pending" | "Failed"
      claim_status: "Submitted" | "Approved" | "Rejected"
      referral_urgency: "Routine" | "Urgent" | "Emergency"
      referral_status: "Pending" | "Received" | "Completed" | "No Feedback"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["Clinician","Nurse","Pharmacist","Lab Technician","Admin","Finance Officer","Doctor"],
      profile_status: ["pending", "approved", "rejected"],
      gender: ["Male", "Female"],
      triage_level: ["Red", "Orange", "Yellow", "Green", "Blue"],
      queue_status: ["Waiting", "Triaged", "In Consult", "Done", "Did Not Wait"],
      lab_priority: ["Routine", "Urgent", "STAT"],
      lab_order_status: ["Pending", "Collected", "Processing", "Completed"],
      result_flag: ["Normal", "High", "Low"],
      payment_method: ["M-Pesa", "NHIF", "Cash", "Insurance"],
      payment_status: ["Paid", "Pending", "Failed"],
      claim_status: ["Submitted", "Approved", "Rejected"],
      referral_urgency: ["Routine", "Urgent", "Emergency"],
      referral_status: ["Pending", "Received", "Completed", "No Feedback"],
    },
  },
} as const