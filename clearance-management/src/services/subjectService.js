import { supabase } from '../lib/supabase';

export const subjectService = {
  // Get all subjects
  async getAllSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        teacher:users(name, role, department)
      `)
      .order('code', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get subject by ID
  async getSubjectById(subjectId) {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        teacher:users(name, role, department)
      `)
      .eq('id', subjectId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get subjects by teacher
  async getSubjectsByTeacher(teacherId) {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('code', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Create new subject
  async createSubject(subjectData) {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subjectData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update subject
  async updateSubject(subjectId, updates) {
    const { data, error } = await supabase
      .from('subjects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subjectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete subject
  async deleteSubject(subjectId) {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId);

    if (error) throw error;
  },
};
