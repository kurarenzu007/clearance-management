import { supabase } from '../lib/supabase';

export const userService = {
  // Get all users
  async getAllUsers(role = null) {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Get user by ID
  async getUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Get user by student ID
  async getUserByStudentId(studentId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new user
  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user
  async updateUser(userId, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete user
  async deleteUser(userId) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // Get students by teacher
  async getStudentsByTeacher(teacherId) {
    const { data, error } = await supabase
      .from('clearances')
      .select(`
        student:users!clearances_student_id_fkey(*)
      `)
      .eq('teacher_id', teacherId);

    if (error) throw error;

    // Extract unique students
    const uniqueStudents = [];
    const studentIds = new Set();

    data.forEach(item => {
      if (item.student && !studentIds.has(item.student.id)) {
        studentIds.add(item.student.id);
        uniqueStudents.push(item.student);
      }
    });

    return uniqueStudents;
  },
};
