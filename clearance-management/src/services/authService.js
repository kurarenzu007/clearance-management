import { supabase } from '../lib/supabase';

export const authService = {
  // Sign in with email and password
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) throw userError;

    return { user: data.user, profile: userData };
  },

  // Sign up new user
  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: data.user.id,
          email,
          ...userData,
        },
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    return { user: data.user, profile };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Get current user profile
  async getCurrentUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
