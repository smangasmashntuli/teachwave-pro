import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticateToken);
router.use(authorizeRoles('teacher'));

// Get teacher dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get teacher info
    const [teachers] = await pool.query(
      'SELECT * FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = teachers[0];

    // Get assigned subjects count
    const [subjectCount] = await pool.query(
      'SELECT COUNT(*) as count FROM teacher_assignments WHERE teacher_id = ?',
      [teacher.id]
    );

    // Get total students across all subjects
    const [studentCount] = await pool.query(
      `SELECT COUNT(DISTINCT se.student_id) as count 
       FROM subject_enrollments se
       INNER JOIN teacher_assignments ta ON se.subject_id = ta.subject_id
       WHERE ta.teacher_id = ? AND se.is_active = TRUE`,
      [teacher.id]
    );

    // Get assignments count
    const [assignmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM assignments WHERE teacher_id = ?',
      [teacher.id]
    );

    res.json({
      stats: {
        assignedSubjects: subjectCount[0].count,
        totalStudents: studentCount[0].count,
        totalAssignments: assignmentCount[0].count,
        upcomingClasses: 0 // TODO: Add virtual classes count
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get teacher's assigned subjects with details
router.get('/subjects', async (req, res) => {
  try {
    const userId = req.user.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [subjects] = await pool.query(
      `SELECT s.id, s.name, s.code, s.description, 
              g.id as grade_id, g.name as grade_name,
              ta.assigned_date,
              COUNT(DISTINCT se.student_id) as student_count,
              COUNT(DISTINCT a.id) as assignment_count
       FROM subjects s
       INNER JOIN teacher_assignments ta ON s.id = ta.subject_id
       INNER JOIN grades g ON ta.grade_id = g.id
       LEFT JOIN subject_enrollments se ON s.id = se.subject_id AND se.is_active = TRUE
       LEFT JOIN assignments a ON s.id = a.subject_id AND a.teacher_id = ta.teacher_id AND a.grade_id = ta.grade_id
       WHERE ta.teacher_id = ?
       GROUP BY s.id, s.name, s.code, s.description, g.id, g.name, ta.assigned_date
       ORDER BY g.id, s.name`,
      [teachers[0].id]
    );

    res.json({ subjects });
  } catch (error) {
    console.error('Subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get students enrolled in teacher's subjects
router.get('/students', async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId, gradeId } = req.query;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    let query = `
      SELECT DISTINCT u.id, u.full_name, u.email, u.phone,
             st.student_number, st.grade_id,
             g.name as grade_name,
             sg.name as stream_name,
             s.name as subject_name,
             s.id as subject_id
      FROM users u
      INNER JOIN students st ON u.id = st.user_id
      INNER JOIN grades g ON st.grade_id = g.id
      LEFT JOIN subject_groups sg ON st.subject_group_id = sg.id
      INNER JOIN subject_enrollments se ON st.id = se.student_id
      INNER JOIN subjects s ON se.subject_id = s.id
      INNER JOIN teacher_assignments ta ON s.id = ta.subject_id AND ta.grade_id = st.grade_id
      WHERE ta.teacher_id = ? AND se.is_active = TRUE
    `;

    const params = [teachers[0].id];

    if (subjectId) {
      query += ' AND s.id = ?';
      params.push(subjectId);
    }

    if (gradeId) {
      query += ' AND st.grade_id = ?';
      params.push(gradeId);
    }

    query += ' ORDER BY g.name, u.full_name';

    const [students] = await pool.query(query, params);

    res.json({ students });
  } catch (error) {
    console.error('Students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get teacher's assignments with submission stats
router.get('/assignments', async (req, res) => {
  try {
    const userId = req.user.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [assignments] = await pool.query(
      `SELECT a.id, a.title, a.description, a.due_date, a.total_points, a.created_at,
              s.name as subject_name, s.code as subject_code, s.id as subject_id,
              g.name as grade_name, g.id as grade_id,
              COUNT(DISTINCT se.student_id) as total_students,
              COUNT(DISTINCT asub.id) as submitted_count,
              COUNT(DISTINCT CASE WHEN asub.grade IS NOT NULL THEN asub.id END) as graded_count
       FROM assignments a
       INNER JOIN subjects s ON a.subject_id = s.id
       INNER JOIN grades g ON a.grade_id = g.id
       LEFT JOIN subject_enrollments se ON s.id = se.subject_id AND se.is_active = TRUE
       LEFT JOIN students st ON se.student_id = st.id AND st.grade_id = a.grade_id
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id
       WHERE a.teacher_id = ?
       GROUP BY a.id, a.title, a.description, a.due_date, a.total_points, a.created_at,
                s.name, s.code, s.id, g.name, g.id
       ORDER BY a.due_date DESC`,
      [teachers[0].id]
    );

    res.json({ assignments });
  } catch (error) {
    console.error('Assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignment submissions for grading
router.get('/assignments/:id/submissions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify teacher owns this assignment
    const [assignment] = await pool.query(
      'SELECT * FROM assignments WHERE id = ? AND teacher_id = ?',
      [id, teachers[0].id]
    );

    if (assignment.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [submissions] = await pool.query(
      `SELECT asub.id, asub.submission_text, asub.file_url, asub.submitted_at, 
              asub.grade, asub.feedback, asub.graded_at,
              u.full_name as student_name, u.email as student_email,
              st.student_number
       FROM assignment_submissions asub
       INNER JOIN students st ON asub.student_id = st.id
       INNER JOIN users u ON st.user_id = u.id
       WHERE asub.assignment_id = ?
       ORDER BY asub.submitted_at DESC`,
      [id]
    );

    res.json({ assignment: assignment[0], submissions });
  } catch (error) {
    console.error('Submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Grade assignment submission
router.put('/submissions/:id/grade', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { grade, feedback } = req.body;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify teacher owns the assignment
    const [submission] = await pool.query(
      `SELECT asub.*, a.teacher_id, a.total_points
       FROM assignment_submissions asub
       INNER JOIN assignments a ON asub.assignment_id = a.id
       WHERE asub.id = ?`,
      [id]
    );

    if (submission.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission[0].teacher_id !== teachers[0].id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (grade > submission[0].total_points) {
      return res.status(400).json({ error: 'Grade exceeds total points' });
    }

    await pool.query(
      'UPDATE assignment_submissions SET grade = ?, feedback = ?, graded_at = NOW() WHERE id = ?',
      [grade, feedback, id]
    );

    res.json({ message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// Create assignment
router.post('/assignments', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, subjectId, dueDate, totalPoints } = req.body;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO assignments (title, description, subject_id, teacher_id, due_date, total_points)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, subjectId, teachers[0].id, dueDate, totalPoints || 100]
    );

    res.status(201).json({
      message: 'Assignment created successfully',
      assignmentId: result.insertId
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

export default router;
