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

// ============================================
// SUBJECT DETAIL & CONTENT MANAGEMENT ROUTES
// ============================================

// Get subject detail with content counts
router.get('/subjects/:id/detail', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    // Get teacher info
    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacherId = teachers[0].id;

    // Verify teacher is assigned to this subject
    const [assignments] = await pool.query(
      `SELECT ta.*, s.name, s.code, s.description, g.name as grade_name
       FROM teacher_assignments ta
       INNER JOIN subjects s ON ta.subject_id = s.id
       INNER JOIN grades g ON ta.grade_id = g.id
       WHERE ta.teacher_id = ? AND ta.subject_id = ?`,
      [teacherId, subjectId]
    );

    if (assignments.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to this subject' });
    }

    const assignment = assignments[0];

    // Count learning materials
    const [materialCount] = await pool.query(
      'SELECT COUNT(*) as count FROM learning_materials WHERE subject_id = ? AND grade_id = ? AND teacher_id = ?',
      [subjectId, assignment.grade_id, teacherId]
    );

    // Count quizzes
    const [quizCount] = await pool.query(
      'SELECT COUNT(*) as count FROM quizzes WHERE subject_id = ? AND grade_id = ? AND teacher_id = ?',
      [subjectId, assignment.grade_id, teacherId]
    );

    // Count tests
    const [testCount] = await pool.query(
      'SELECT COUNT(*) as count FROM tests WHERE subject_id = ? AND grade_id = ? AND teacher_id = ?',
      [subjectId, assignment.grade_id, teacherId]
    );

    // Count assignments
    const [assignmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM assignments WHERE subject_id = ? AND teacher_id = ?',
      [subjectId, teacherId]
    );

    // Count resources
    const [resourceCount] = await pool.query(
      'SELECT COUNT(*) as count FROM additional_resources WHERE subject_id = ? AND grade_id = ? AND teacher_id = ?',
      [subjectId, assignment.grade_id, teacherId]
    );

    // Count students enrolled
    const [studentCount] = await pool.query(
      `SELECT COUNT(DISTINCT se.student_id) as count 
       FROM subject_enrollments se
       WHERE se.subject_id = ? AND se.is_active = TRUE`,
      [subjectId]
    );

    res.json({
      subject: {
        id: subjectId,
        name: assignment.name,
        code: assignment.code,
        description: assignment.description,
        grade: assignment.grade_name,
        gradeId: assignment.grade_id
      },
      counts: {
        materials: materialCount[0].count,
        quizzes: quizCount[0].count,
        tests: testCount[0].count,
        assignments: assignmentCount[0].count,
        resources: resourceCount[0].count,
        students: studentCount[0].count
      }
    });
  } catch (error) {
    console.error('Get subject detail error:', error);
    res.status(500).json({ error: 'Failed to fetch subject detail' });
  }
});

// Get learning materials for a subject
router.get('/subjects/:id/learning-materials', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [materials] = await pool.query(
      `SELECT lm.*, g.name as grade_name
       FROM learning_materials lm
       INNER JOIN grades g ON lm.grade_id = g.id
       WHERE lm.subject_id = ? AND lm.teacher_id = ?
       ORDER BY lm.created_at DESC`,
      [subjectId, teachers[0].id]
    );

    res.json({ materials });
  } catch (error) {
    console.error('Get learning materials error:', error);
    res.status(500).json({ error: 'Failed to fetch learning materials' });
  }
});

// Create learning material
router.post('/subjects/:id/learning-materials', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;
    const { title, description, gradeId, fileUrl, fileType } = req.body;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO learning_materials (title, description, subject_id, grade_id, teacher_id, file_url, file_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, subjectId, gradeId, teachers[0].id, fileUrl, fileType]
    );

    res.status(201).json({
      message: 'Learning material created successfully',
      materialId: result.insertId
    });
  } catch (error) {
    console.error('Create learning material error:', error);
    res.status(500).json({ error: 'Failed to create learning material' });
  }
});

// Get quizzes for a subject
router.get('/subjects/:id/quizzes', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [quizzes] = await pool.query(
      `SELECT q.*, g.name as grade_name,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
              (SELECT COUNT(*) FROM quiz_submissions WHERE quiz_id = q.id) as submission_count
       FROM quizzes q
       INNER JOIN grades g ON q.grade_id = g.id
       WHERE q.subject_id = ? AND q.teacher_id = ?
       ORDER BY q.created_at DESC`,
      [subjectId, teachers[0].id]
    );

    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Create quiz with questions
router.post('/subjects/:id/quizzes', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;
    const { title, description, gradeId, totalPoints, timeLimitMinutes, dueDate, questions } = req.body;

    const [teachers] = await connection.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    await connection.beginTransaction();

    // Create quiz
    const [quizResult] = await connection.query(
      `INSERT INTO quizzes (title, description, subject_id, grade_id, teacher_id, total_points, time_limit_minutes, due_date, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [title, description, subjectId, gradeId, teachers[0].id, totalPoints || 10, timeLimitMinutes || 15, dueDate]
    );

    const quizId = quizResult.insertId;

    // Insert questions
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await connection.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, correct_answer, options, order_number)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [quizId, q.questionText, q.questionType, q.points || 1, q.correctAnswer, JSON.stringify(q.options || null), i + 1]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Quiz created successfully',
      quizId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create quiz error:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  } finally {
    connection.release();
  }
});

// Get quiz results
router.get('/quizzes/:id/results', async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get quiz info
    const [quizzes] = await pool.query(
      'SELECT * FROM quizzes WHERE id = ? AND teacher_id = ?',
      [quizId, teachers[0].id]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get submissions with student info
    const [submissions] = await pool.query(
      `SELECT qs.*, s.student_number, u.full_name as student_name
       FROM quiz_submissions qs
       INNER JOIN students s ON qs.student_id = s.id
       INNER JOIN users u ON s.user_id = u.id
       WHERE qs.quiz_id = ?
       ORDER BY qs.submitted_at DESC`,
      [quizId]
    );

    res.json({
      quiz: quizzes[0],
      submissions
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// Get tests for a subject
router.get('/subjects/:id/tests', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [tests] = await pool.query(
      `SELECT t.*, g.name as grade_name,
              (SELECT COUNT(*) FROM test_questions WHERE test_id = t.id) as question_count,
              (SELECT COUNT(*) FROM test_submissions WHERE test_id = t.id) as submission_count
       FROM tests t
       INNER JOIN grades g ON t.grade_id = g.id
       WHERE t.subject_id = ? AND t.teacher_id = ?
       ORDER BY t.created_at DESC`,
      [subjectId, teachers[0].id]
    );

    res.json({ tests });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Create test with questions
router.post('/subjects/:id/tests', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;
    const { title, description, gradeId, totalPoints, durationMinutes, dueDate, questions } = req.body;

    const [teachers] = await connection.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    await connection.beginTransaction();

    // Create test
    const [testResult] = await connection.query(
      `INSERT INTO tests (title, description, subject_id, grade_id, teacher_id, total_points, duration_minutes, due_date, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [title, description, subjectId, gradeId, teachers[0].id, totalPoints || 100, durationMinutes, dueDate]
    );

    const testId = testResult.insertId;

    // Insert questions
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await connection.query(
          `INSERT INTO test_questions (test_id, question_text, question_type, points, correct_answer, options, order_number)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [testId, q.questionText, q.questionType, q.points || 1, q.correctAnswer, JSON.stringify(q.options || null), i + 1]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Test created successfully',
      testId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  } finally {
    connection.release();
  }
});

// Get test results
router.get('/tests/:id/results', async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = req.params.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get test info
    const [tests] = await pool.query(
      'SELECT * FROM tests WHERE id = ? AND teacher_id = ?',
      [testId, teachers[0].id]
    );

    if (tests.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Get submissions with student info
    const [submissions] = await pool.query(
      `SELECT ts.*, s.student_number, u.full_name as student_name
       FROM test_submissions ts
       INNER JOIN students s ON ts.student_id = s.id
       INNER JOIN users u ON s.user_id = u.id
       WHERE ts.test_id = ?
       ORDER BY ts.submitted_at DESC`,
      [testId]
    );

    res.json({
      test: tests[0],
      submissions
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Get additional resources for a subject
router.get('/subjects/:id/resources', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [resources] = await pool.query(
      `SELECT ar.*, g.name as grade_name
       FROM additional_resources ar
       INNER JOIN grades g ON ar.grade_id = g.id
       WHERE ar.subject_id = ? AND ar.teacher_id = ?
       ORDER BY ar.created_at DESC`,
      [subjectId, teachers[0].id]
    );

    res.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Create additional resource
router.post('/subjects/:id/resources', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;
    const { title, description, gradeId, resourceType, fileUrl, externalLink } = req.body;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO additional_resources (title, description, subject_id, grade_id, teacher_id, resource_type, file_url, external_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, subjectId, gradeId, teachers[0].id, resourceType || 'file', fileUrl, externalLink]
    );

    res.status(201).json({
      message: 'Resource created successfully',
      resourceId: result.insertId
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

export default router;
