// supabaseClient.js
const SUPABASE_URL = 'https://qizejcrlxqailqjrqkeo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpemVqY3JseHFhaWxxanJxa2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwNzU2MjksImV4cCI6MjA0OTY1MTYyOX0.wN-5phYnElhU7IPQQ6B8jehoJGD89POzJjXMWg511cg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export { supabase };
