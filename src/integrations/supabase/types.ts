export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          bank_name: string
          company_id: string
          created_at: string
          created_by: string | null
          current_balance: number
          id: string
          initial_balance: number
          is_active: boolean
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_name: string
          company_id: string
          created_at?: string
          created_by?: string | null
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_balance?: number
          id?: string
          initial_balance?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at: string
          date: string
          description: string | null
          id: string
          import_ref: string | null
          reconciled: boolean
          reconciled_with_id: string | null
          reconciled_with_type: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at?: string
          date: string
          description?: string | null
          id?: string
          import_ref?: string | null
          reconciled?: boolean
          reconciled_with_id?: string | null
          reconciled_with_type?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          company_id?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          import_ref?: string | null
          reconciled?: boolean
          reconciled_with_id?: string | null
          reconciled_with_type?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          account_id: string
          amount: number
          cost_center_id: string | null
          created_at: string
          id: string
          month: number
          notes: string | null
          scenario_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount?: number
          cost_center_id?: string | null
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          scenario_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          cost_center_id?: string | null
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          scenario_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "budget_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_scenarios: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_scenarios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          code: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          is_analytical: boolean
          name: string
          nature: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_analytical?: boolean
          name: string
          nature: string
          parent_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_analytical?: boolean
          name?: string
          nature?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          default_currency: string
          fiscal_config: Json | null
          id: string
          name: string
          tax_regime: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          default_currency?: string
          fiscal_config?: Json | null
          id?: string
          name: string
          tax_regime?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          default_currency?: string
          fiscal_config?: Json | null
          id?: string
          name?: string
          tax_regime?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          code: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contracts: {
        Row: {
          company_id: string
          contract_type: string
          created_at: string
          description: string | null
          document_url: string | null
          employee_id: string
          end_date: string | null
          id: string
          monthly_value: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_type?: string
          created_at?: string
          description?: string | null
          document_url?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          monthly_value: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_type?: string
          created_at?: string
          description?: string | null
          document_url?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          monthly_value?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_info: Json | null
          company_id: string
          contract_type: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department: string | null
          end_date: string | null
          id: string
          is_active: boolean
          partner_id: string | null
          role: string | null
          salary: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          bank_info?: Json | null
          company_id: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          role?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          bank_info?: Json | null
          company_id?: string
          contract_type?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          role?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          account_id: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          bank_account_id: string | null
          category_id: string | null
          company_id: string
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string
          due_date: string
          id: string
          is_recurring: boolean
          notes: string | null
          paid_date: string | null
          partner_id: string | null
          pis_cofins_credit: boolean
          recurrence_interval: string | null
          sale_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          category_id?: string | null
          company_id: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description: string
          due_date: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          paid_date?: string | null
          partner_id?: string | null
          pis_cofins_credit?: boolean
          recurrence_interval?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          category_id?: string | null
          company_id?: string
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string
          due_date?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          paid_date?: string | null
          partner_id?: string | null
          pis_cofins_credit?: boolean
          recurrence_interval?: string | null
          sale_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          company_id: string
          created_at: string
          end_date: string
          id: string
          month: number
          start_date: string
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          company_id: string
          created_at?: string
          end_date: string
          id?: string
          month: number
          start_date: string
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          company_id?: string
          created_at?: string
          end_date?: string
          id?: string
          month?: number
          start_date?: string
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_configs: {
        Row: {
          company_id: string
          created_at: string
          default_bank_account_id: string | null
          default_cost_center_id: string | null
          default_expense_category_id: string | null
          event_mapping: Json | null
          field_mapping: Json | null
          id: string
          is_active: boolean
          name: string
          sample_payload: Json | null
          slug: string
          updated_at: string
          vendor_partner_id: string | null
          webhook_secret: string
          webhook_secret_header: string
        }
        Insert: {
          company_id: string
          created_at?: string
          default_bank_account_id?: string | null
          default_cost_center_id?: string | null
          default_expense_category_id?: string | null
          event_mapping?: Json | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean
          name: string
          sample_payload?: Json | null
          slug: string
          updated_at?: string
          vendor_partner_id?: string | null
          webhook_secret?: string
          webhook_secret_header?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          default_bank_account_id?: string | null
          default_cost_center_id?: string | null
          default_expense_category_id?: string | null
          event_mapping?: Json | null
          field_mapping?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          sample_payload?: Json | null
          slug?: string
          updated_at?: string
          vendor_partner_id?: string | null
          webhook_secret?: string
          webhook_secret_header?: string
        }
        Relationships: [
          {
            foreignKeyName: "gateway_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_configs_default_bank_account_id_fkey"
            columns: ["default_bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_configs_default_cost_center_id_fkey"
            columns: ["default_cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_configs_default_expense_category_id_fkey"
            columns: ["default_expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gateway_configs_vendor_partner_id_fkey"
            columns: ["vendor_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_fee_rules: {
        Row: {
          created_at: string
          fee_percentage: number
          fixed_fee: number
          gateway_config_id: string
          id: string
          installments_max: number
          installments_min: number
          payment_method: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee_percentage?: number
          fixed_fee?: number
          gateway_config_id: string
          id?: string
          installments_max?: number
          installments_min?: number
          payment_method?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee_percentage?: number
          fixed_fee?: number
          gateway_config_id?: string
          id?: string
          installments_max?: number
          installments_min?: number
          payment_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gateway_fee_rules_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "gateway_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_receivable_rules: {
        Row: {
          created_at: string
          gateway_config_id: string
          id: string
          payment_method: string
          recurring_months: number | null
          rule_type: string
          splits: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gateway_config_id: string
          id?: string
          payment_method?: string
          recurring_months?: number | null
          rule_type?: string
          splits?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gateway_config_id?: string
          id?: string
          payment_method?: string
          recurring_months?: number | null
          rule_type?: string
          splits?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gateway_receivable_rules_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "gateway_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          api_key_encrypted: string | null
          company_id: string
          created_at: string
          endpoint_url: string | null
          id: string
          is_active: boolean
          provider: string
          updated_at: string
          webhook_secret: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          company_id: string
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_active?: boolean
          provider: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          company_id?: string
          created_at?: string
          endpoint_url?: string | null
          id?: string
          is_active?: boolean
          provider?: string
          updated_at?: string
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          fiscal_period_id: string | null
          id: string
          is_automatic: boolean
          is_reversed: boolean
          reference_id: string | null
          reference_type: string | null
          reversed_by: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          fiscal_period_id?: string | null
          id?: string
          is_automatic?: boolean
          is_reversed?: boolean
          reference_id?: string | null
          reference_type?: string | null
          reversed_by?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          fiscal_period_id?: string | null
          id?: string
          is_automatic?: boolean
          is_reversed?: boolean
          reference_id?: string | null
          reference_type?: string | null
          reversed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          cost_center_id: string | null
          created_at: string
          credit_amount: number
          debit_amount: number
          description: string | null
          id: string
          journal_entry_id: string
          partner_id: string | null
        }
        Insert: {
          account_id: string
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          description?: string | null
          id?: string
          journal_entry_id: string
          partner_id?: string | null
        }
        Update: {
          account_id?: string
          cost_center_id?: string | null
          created_at?: string
          credit_amount?: number
          debit_amount?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
          partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: Json | null
          avatar_url: string | null
          bank_info: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          bank_info?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          bank_info?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_installments: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          due_date: string
          gateway_transaction_id: string | null
          id: string
          installment_number: number
          paid_amount: number | null
          paid_date: string | null
          revenue_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          due_date: string
          gateway_transaction_id?: string | null
          id?: string
          installment_number: number
          paid_amount?: number | null
          paid_date?: string | null
          revenue_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          due_date?: string
          gateway_transaction_id?: string | null
          id?: string
          installment_number?: number
          paid_amount?: number | null
          paid_date?: string | null
          revenue_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_installments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_installments_revenue_id_fkey"
            columns: ["revenue_id"]
            isOneToOne: false
            referencedRelation: "revenues"
            referencedColumns: ["id"]
          },
        ]
      }
      revenues: {
        Row: {
          company_id: string
          contracted_at: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          expires_at: string | null
          gateway: string | null
          gateway_ref: string | null
          id: string
          installments_count: number
          notes: string | null
          partner_id: string | null
          payment_type: string
          sale_id: string | null
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          contracted_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          gateway?: string | null
          gateway_ref?: string | null
          id?: string
          installments_count?: number
          notes?: string | null
          partner_id?: string | null
          payment_type?: string
          sale_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          contracted_at?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          expires_at?: string | null
          gateway?: string | null
          gateway_ref?: string | null
          id?: string
          installments_count?: number
          notes?: string | null
          partner_id?: string | null
          payment_type?: string
          sale_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenues_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenues_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          gateway_config_id: string | null
          gateway_ref: string | null
          gateway_transaction_id: string | null
          id: string
          installments_count: number
          net_amount: number | null
          nf_issued: boolean
          nf_issued_at: string | null
          nf_number: string | null
          partner_id: string | null
          payment_method: string | null
          product_name: string | null
          requires_nf: boolean
          sale_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          gateway_config_id?: string | null
          gateway_ref?: string | null
          gateway_transaction_id?: string | null
          id?: string
          installments_count?: number
          net_amount?: number | null
          nf_issued?: boolean
          nf_issued_at?: string | null
          nf_number?: string | null
          partner_id?: string | null
          payment_method?: string | null
          product_name?: string | null
          requires_nf?: boolean
          sale_date?: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          gateway_config_id?: string | null
          gateway_ref?: string | null
          gateway_transaction_id?: string | null
          id?: string
          installments_count?: number
          net_amount?: number | null
          nf_issued?: boolean
          nf_issued_at?: string | null
          nf_number?: string | null
          partner_id?: string | null
          payment_method?: string | null
          product_name?: string | null
          requires_nf?: boolean
          sale_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "gateway_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_entries: {
        Row: {
          base_amount: number
          company_id: string
          created_at: string
          entry_type: string
          fiscal_period_id: string | null
          id: string
          rate: number
          reference_id: string | null
          reference_type: string | null
          tax_amount: number
          tax_type: string
        }
        Insert: {
          base_amount: number
          company_id: string
          created_at?: string
          entry_type: string
          fiscal_period_id?: string | null
          id?: string
          rate: number
          reference_id?: string | null
          reference_type?: string | null
          tax_amount: number
          tax_type: string
        }
        Update: {
          base_amount?: number
          company_id?: string
          created_at?: string
          entry_type?: string
          fiscal_period_id?: string | null
          id?: string
          rate?: number
          reference_id?: string | null
          reference_type?: string | null
          tax_amount?: number
          tax_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_entries_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          company_id: string | null
          created_at: string
          error_message: string | null
          event_type: string | null
          gateway_config_id: string | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          source: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          gateway_config_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          source: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          gateway_config_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_gateway_config_id_fkey"
            columns: ["gateway_config_id"]
            isOneToOne: false
            referencedRelation: "gateway_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      withholding_taxes: {
        Row: {
          base_amount: number
          company_id: string
          created_at: string
          expense_id: string | null
          id: string
          rate: number
          tax_type: string
          withheld_amount: number
        }
        Insert: {
          base_amount: number
          company_id: string
          created_at?: string
          expense_id?: string | null
          id?: string
          rate: number
          tax_type: string
          withheld_amount: number
        }
        Update: {
          base_amount?: number
          company_id?: string
          created_at?: string
          expense_id?: string | null
          id?: string
          rate?: number
          tax_type?: string
          withheld_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "withholding_taxes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withholding_taxes_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_create_journal_entry: {
        Args: {
          p_company_id: string
          p_description: string
          p_entry_date: string
          p_is_automatic?: boolean
          p_lines?: Json
          p_reference_id?: string
          p_reference_type?: string
        }
        Returns: string
      }
      fn_get_user_company_id: { Args: never; Returns: string }
      fn_revenue_expense_monthly: {
        Args: never
        Returns: {
          despesa: number
          month_label: string
          receita: number
        }[]
      }
      fn_seed_chart_of_accounts: {
        Args: { p_company_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
