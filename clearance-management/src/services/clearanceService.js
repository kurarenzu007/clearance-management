import { supabase } from '../lib/supabase';

export const clearanceService = {
  // Get all clearances for a student
  async getStudentClearances(studentId) {
    const { data, error } = await supabase
      .from('clearances')
      .select(`
        *,
        subject:subjects(*),
        teacher:users!clearances_teacher_id_fkey(*)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get all clearances for a teacher
  async getTeacherClearances(teacherId, status = null) {
    let query = supabase
      .from('clearances')
      .select(`
        *,
        student:users!clearances_student_id_fkey(*),
        subject:subjects(*)
      `)
      .eq('teacher_id', teacherId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get all clearances (admin)
  async getAllClearances(filters = {}) {
    let query = supabase
      .from('clearances')
      .select(`
        *,
        student:users!clearances_student_id_fkey(*),
        teacher:users!clearances_teacher_id_fkey(*),
        subject:subjects(*)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.studentId) {
      query = query.eq('student_id', filters.studentId);
    }

    if (filters.teacherId) {
      query = query.eq('teacher_id', filters.teacherId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update clearance status
  async updateClearanceStatus(clearanceId, status, remarks = null) {
    const updateData = {
      status,
      remarks,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cleared') {
      updateData.cleared_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('clearances')
      .update(updateData)
      .eq('id', clearanceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bulk update clearances
  async bulkUpdateClearances(clearanceIds, status, remarks = null) {
    const updateData = {
      status,
      remarks,
      updated_at: new Date().toISOString(),
    };

    if (status === 'cleared') {
      updateData.cleared_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('clearances')
      .update(updateData)
      .in('id', clearanceIds)
      .select();

    if (error) throw error;
    return data;
  },

  // Get clearance history
  async getClearanceHistory(clearanceId) {
    const { data, error } = await supabase
      .from('clearance_history')
      .select(`
        *,
        changed_by_user:users(name, role)
      `)
      .eq('clearance_id', clearanceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get clearance statistics
  async getClearanceStats(userId = null, role = null) {
    let query = supabase.from('clearances').select('status');

    if (role === 'student' && userId) {
      query = query.eq('student_id', userId);
    } else if (role === 'teacher' && userId) {
      query = query.eq('teacher_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = {
      total: data.length,
      cleared: data.filter(c => c.status === 'cleared').length,
      pending: data.filter(c => c.status === 'pending').length,
      rejected: data.filter(c => c.status === 'rejected').length,
      held: data.filter(c => c.status === 'held').length,
      deficiency: data.filter(c => c.status === 'deficiency').length,
    };

    return stats;
  },
};
