export type TransactionType = 'income' | 'expense'
export interface Profile {
  id: string
  full_name: string
  currency: string
  created_at: string
  updated_at: string
}
export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  icon: string
  color: string
  created_at: string
  updated_at: string
}
export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  category_id: string
  description: string
  transaction_date: string
  receipt_path: string | null
  created_at: string
  updated_at: string
}
export interface Budget {
  id: string
  user_id: string
  category_id: string | null
  category_type: 'expense'
  month: string
  amount: number
  created_at: string
  updated_at: string
}
type Table<Row, Required extends keyof Row> = {
  Row: { [Key in keyof Row]: Row[Key] }
  Insert: Pick<Row, Required> & Partial<Row>
  Update: Partial<Row>
  Relationships: []
}
export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile, 'id'>
      categories: Table<Category, 'user_id' | 'name' | 'type'>
      transactions: Table<
        Transaction,
        'user_id' | 'type' | 'amount' | 'category_id' | 'transaction_date'
      >
      budgets: Table<Budget, 'user_id' | 'month' | 'amount'>
    }
    Views: Record<string, never>
    Functions: {
      finance_summary: {
        Args: { start_date: string; end_date: string }
        Returns: {
          income: number
          expenses: number
          category_totals: { category_id: string; amount: number }[]
          monthly_totals: { month: string; income: number; expenses: number }[]
        }
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
export interface FinanceSummary {
  income: number
  expenses: number
  category_totals: { category_id: string; amount: number }[]
  monthly_totals: { month: string; income: number; expenses: number }[]
}
