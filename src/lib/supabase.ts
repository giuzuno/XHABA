import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckcocrvhudmbrmvgwoqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrY29jcnZodWRtYnJtdmd3b3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDUzNzIsImV4cCI6MjA5MDMyMTM3Mn0.kLkP6pTY3udtdiq6STzwNIJWwSRLGEbxuS-it6b7s3k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
