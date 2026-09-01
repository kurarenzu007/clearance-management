import { supabase } from '../lib/supabase';

export const settingsService = {
  // Get all system settings rows
  async getAll() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');
    if (error) throw error;
    return data;
  },

  // Get a single setting by key
  async get(key) {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('key', key)
      .single();
    if (error) throw error;
    return data?.value ?? null;
  },

  // Upsert a setting (insert or update by key)
  async set(key, value) {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
