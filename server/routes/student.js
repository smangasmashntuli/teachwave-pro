import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticateToken);
router.use(authorizeRoles('student'));

// Get student dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student info
    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = students[0];

    // Get enrolled subjects count
    const [subjectCount] = await pool.query(
      'SELECT COUNT(*) as count FROM subject_enrollments WHERE student_id = ? AND is_active = TRUE',
      [student.id]
    );

    // Get upcoming classes count
    const [classCount] = await pool.query(
      `SELECT COUNT(*) as count FROM virtual_classes vc
       INNER JOIN subject_enrollments se ON vc.subject_id = se.subject_id
       WHERE se.student_id = ? AND vc.scheduled_start > NOW() AND vc.status = 'scheduled'`,
      [student.id]
    );

    // Get completed assignments count
    const [assignmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM assignment_submissions WHERE student_id = ?',
      [student.id]
    );

    res.json({
      stats: {
        enrolledSubjects: subjectCount[0].count,
        upcomingClasses: classCount[0].count,
        completedAssignments: assignmentCount[0].count,
        attendanceRate: 85 // TODO: Calculate actual attendance
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get student subjects
router.get('/subjects', async (req, res) => {
  try {
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [subjects] = await pool.query(
      `SELECT s.*, se.enrollment_date 
       FROM subjects s
       INNER JOIN subject_enrollments se ON s.id = se.subject_id
       WHERE se.student_id = ? AND se.is_active = TRUE
       ORDER BY s.name`,
      [students[0].id]
    );

    res.json({ subjects });
  } catch (error) {
    console.error('Subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get student assignments
router.get('/assignments', async (req, res) => {
  try {
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [assignments] = await pool.query(
      `SELECT a.*, s.name as subject_name, 
       asub.grade, asub.submitted_at, asub.feedback
       FROM assignments a
       INNER JOIN subjects s ON a.subject_id = s.id
       INNER JOIN subject_enrollments se ON s.id = se.subject_id
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
       WHERE se.student_id = ? AND se.is_active = TRUE
       ORDER BY a.due_date DESC`,
      [students[0].id, students[0].id]
    );

    res.json({ assignments });
  } catch (error) {
    console.error('Assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

export default router;
