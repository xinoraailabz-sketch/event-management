/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eaastbqspumgteqlbler.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhYXN0YnFzcHVtZ3RlcWxibGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Mzg3ODMsImV4cCI6MjEwMzQxNDc4M30.5-qsbbAUAoDJg4b8JJb_LV_VGddxpNEkxTxVLqyEGO0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
