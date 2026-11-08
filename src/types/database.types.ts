export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "REVERSAL";
export type SaleStatus = "COMPLETED" | "VOIDED";
export type StockStatus = "WAITING" | "COLLECTING" | "NORMAL" | "LOW" | "CRITICAL";
export type AiInsightStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      store_members: {
        Row: {
          id: string;
          store_id: string;
          user_id: string;
          role: "OWNER" | "STAFF";
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          user_id: string;
          role: "OWNER" | "STAFF";
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          user_id?: string;
          role?: "OWNER" | "STAFF";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "store_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      suppliers: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          phone: string | null;
          lead_time_days: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          phone?: string | null;
          lead_time_days?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          phone?: string | null;
          lead_time_days?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "suppliers_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          supplier_id: string | null;
          name: string;
          sku: string;
          description: string | null;
          initial_stock: number;
          current_stock: number;
          unit: string;
          cost_price: number;
          selling_price: number;
          safety_stock: number;
          target_inventory_days: number;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          category_id?: string | null;
          supplier_id?: string | null;
          name: string;
          sku: string;
          description?: string | null;
          initial_stock?: number;
          current_stock?: number;
          unit: string;
          cost_price?: number;
          selling_price?: number;
          safety_stock?: number;
          target_inventory_days?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          store_id?: string;
          category_id?: string | null;
          supplier_id?: string | null;
          name?: string;
          sku?: string;
          description?: string | null;
          initial_stock?: number;
          current_stock?: number;
          unit?: string;
          cost_price?: number;
          selling_price?: number;
          safety_stock?: number;
          target_inventory_days?: number;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
          id: string;
          store_id: string;
          transaction_number: string;
          user_id: string;
          transaction_date: string;
          total_amount: number;
          status: SaleStatus;
          idempotency_key: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          transaction_number: string;
          user_id: string;
          transaction_date?: string;
          total_amount: number;
          status?: SaleStatus;
          idempotency_key: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          transaction_number?: string;
          user_id?: string;
          transaction_date?: string;
          total_amount?: number;
          status?: SaleStatus;
          idempotency_key?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Insert: {
          id?: string;
          sale_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
        };
        Update: {
          id?: string;
          sale_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          user_id: string;
          movement_type: StockMovementType;
          quantity: number;
          reference_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id: string;
          user_id: string;
          movement_type: StockMovementType;
          quantity: number;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          product_id?: string;
          user_id?: string;
          movement_type?: StockMovementType;
          quantity?: number;
          reference_id?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_insights: {
        Row: {
          id: string;
          store_id: string;
          product_id: string | null;
          analysis_input: Json;
          analysis_result: Json | null;
          model_name: string;
          status: AiInsightStatus;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id?: string | null;
          analysis_input: Json;
          analysis_result?: Json | null;
          model_name: string;
          status?: AiInsightStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          product_id?: string | null;
          analysis_input?: Json;
          analysis_result?: Json | null;
          model_name?: string;
          status?: AiInsightStatus;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_insights_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      provision_store_and_owner: {
        Args: {
          p_user_id: string;
          p_full_name: string;
          p_store_name: string;
        };
        Returns: Json;
      };
      is_store_member: {
        Args: {
          lookup_store_id: string;
          lookup_user_id?: string;
        };
        Returns: boolean;
      };
      is_store_owner: {
        Args: {
          lookup_store_id: string;
          lookup_user_id?: string;
        };
        Returns: boolean;
      };
      get_user_role: {
        Args: {
          lookup_store_id: string;
          lookup_user_id?: string;
        };
        Returns: string;
      };
      record_stock_in: {
        Args: {
          p_store_id: string;
          p_product_id: string;
          p_quantity: number;
          p_user_id: string;
          p_note?: string | null;
        };
        Returns: Json;
      };
      record_stock_adjustment: {
        Args: {
          p_store_id: string;
          p_product_id: string;
          p_new_stock: number;
          p_user_id: string;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      record_sale: {
        Args: {
          p_store_id: string;
          p_user_id: string;
          p_transaction_number: string;
          p_idempotency_key: string;
          p_items: Json;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      void_sale: {
        Args: {
          p_store_id: string;
          p_user_id: string;
          p_sale_id: string;
          p_reason: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      stock_movement_type: StockMovementType;
      sale_status: SaleStatus;
      stock_status: StockStatus;
      ai_insight_status: AiInsightStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
