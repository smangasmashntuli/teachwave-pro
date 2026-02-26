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
    console.log(`Student subject detail - student_id: ${student.id}, grade_id: ${student.grade_id}`);

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
      'SELECT id, grade_id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [assignments] = await pool.query(
      `SELECT a.id, a.title, a.description, a.due_date, a.total_points, a.created_at,
              s.name as subject_name, s.code as subject_code, s.id as subject_id,
              g.name as grade_name,
              asub.id as submission_id, asub.grade, asub.submitted_at, asub.feedback, asub.submission_text, asub.file_url
       FROM assignments a
       INNER JOIN subjects s ON a.subject_id = s.id
       INNER JOIN grades g ON a.grade_id = g.id
       INNER JOIN subject_enrollments se ON s.id = se.subject_id
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
       WHERE se.student_id = ? AND se.is_active = TRUE AND a.grade_id = ?
       ORDER BY a.due_date DESC`,
      [students[0].id, students[0].id, students[0].grade_id]
    );

    res.json({ assignments });
  } catch (error) {
    console.error('Assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment details
router.get('/assignments/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [assignments] = await pool.query(
      `SELECT a.*, s.name as subject_name, s.code as subject_code,
              g.name as grade_name,
              asub.id as submission_id, asub.submission_text, asub.file_url, 
              asub.submitted_at, asub.grade, asub.feedback, asub.graded_at
       FROM assignments a
       INNER JOIN subjects s ON a.subject_id = s.id
       INNER JOIN grades g ON a.grade_id = g.id
       LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
       WHERE a.id = ?`,
      [students[0].id, id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ assignment: assignments[0] });
  } catch (error) {
    console.error('Assignment detail error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Submit assignment
router.post('/assignments/:id/submit', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { submission_text, file_url } = req.body;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if assignment exists
    const [assignments] = await pool.query(
      'SELECT * FROM assignments WHERE id = ?',
      [id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if already submitted
    const [existing] = await pool.query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?',
      [id, students[0].id]
    );

    if (existing.length > 0) {
      // Update existing submission
      await pool.query(
        'UPDATE assignment_submissions SET submission_text = ?, file_url = ?, submitted_at = NOW() WHERE id = ?',
        [submission_text, file_url, existing[0].id]
      );
      res.json({ message: 'Assignment resubmitted successfully', submissionId: existing[0].id });
    } else {
      // Create new submission
      const [result] = await pool.query(
        'INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_url) VALUES (?, ?, ?, ?)',
        [id, students[0].id, submission_text, file_url]
      );
      res.status(201).json({ message: 'Assignment submitted successfully', submissionId: result.insertId });
    }
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Get student grades/submissions
router.get('/grades', async (req, res) => {
  try {
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [grades] = await pool.query(
      `SELECT asub.id, asub.grade, asub.feedback, asub.submitted_at, asub.graded_at,
              a.title as assignment_title, a.total_points, a.due_date,
              s.name as subject_name, s.code as subject_code
       FROM assignment_submissions asub
       INNER JOIN assignments a ON asub.assignment_id = a.id
       INNER JOIN subjects s ON a.subject_id = s.id
       WHERE asub.student_id = ? AND asub.grade IS NOT NULL
       ORDER BY asub.graded_at DESC`,
      [students[0].id]
    );

    // Calculate statistics
    let totalPoints = 0;
    let earnedPoints = 0;
    grades.forEach(g => {
      totalPoints += g.total_points;
      earnedPoints += g.grade || 0;
    });

    const averagePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    res.json({ 
      grades,
      statistics: {
        totalAssignments: grades.length,
        averagePercentage,
        totalPoints,
        earnedPoints
      }
    });
  } catch (error) {
    console.error('Grades error:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// ============================================
// SUBJECT DETAIL & CONTENT ACCESS ROUTES
// ============================================

// Get subject detail with teacher info
router.get('/subjects/:id/detail', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    // Get student info
    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = students[0];

    // Verify enrollment
    const [enrollments] = await pool.query(
      `SELECT se.*, s.name, s.code, s.description
       FROM subject_enrollments se
       INNER JOIN subjects s ON se.subject_id = s.id
       WHERE se.student_id = ? AND se.subject_id = ? AND se.is_active = TRUE`,
      [student.id, subjectId]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({ error: 'You are not enrolled in this subject' });
    }

    const enrollment = enrollments[0];

    // Get grade name from student's grade
    const [grades] = await pool.query(
      'SELECT name as grade_name FROM grades WHERE id = ?',
      [student.grade_id]
    );

    // Get teacher info
    const [teachers] = await pool.query(
      `SELECT u.full_name as teacher_name, u.email as teacher_email, t.employee_number, t.specialization
       FROM teacher_assignments ta
       INNER JOIN teachers t ON ta.teacher_id = t.id
       INNER JOIN users u ON t.user_id = u.id
       WHERE ta.subject_id = ? AND ta.grade_id = ?
       LIMIT 1`,
      [subjectId, student.grade_id]
    );

    // Count materials
    const [materialCount] = await pool.query(
      'SELECT COUNT(*) as count FROM learning_materials WHERE subject_id = ? AND grade_id = ?',
      [subjectId, student.grade_id]
    );

    // Count quizzes
    const [quizCount] = await pool.query(
      'SELECT COUNT(*) as count FROM quizzes WHERE subject_id = ? AND grade_id = ? AND is_published = TRUE',
      [subjectId, student.grade_id]
    );

    // Count tests
    const [testCount] = await pool.query(
      'SELECT COUNT(*) as count FROM tests WHERE subject_id = ? AND grade_id = ? AND is_published = TRUE',
      [subjectId, student.grade_id]
    );

    // Count assignments
    const [assignmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM assignments WHERE subject_id = ?',
      [subjectId]
    );

    // Count resources
    const [resourceCount] = await pool.query(
      'SELECT COUNT(*) as count FROM additional_resources WHERE subject_id = ? AND grade_id = ?',
      [subjectId, student.grade_id]
    );

    res.json({
      subject: {
        id: subjectId,
        name: enrollment.name,
        code: enrollment.code,
        description: enrollment.description,
        grade: grades.length > 0 ? grades[0].grade_name : 'Unknown',
        enrollmentDate: enrollment.enrollment_date
      },
      teacher: teachers.length > 0 ? teachers[0] : null,
      counts: {
        materials: materialCount[0].count,
        quizzes: quizCount[0].count,
        tests: testCount[0].count,
        assignments: assignmentCount[0].count,
        resources: resourceCount[0].count
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

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [materials] = await pool.query(
      `SELECT lm.*, u.full_name as teacher_name
       FROM learning_materials lm
       INNER JOIN teachers t ON lm.teacher_id = t.id
       INNER JOIN users u ON t.user_id = u.id
       WHERE lm.subject_id = ? AND lm.grade_id = ?
       ORDER BY lm.created_at DESC`,
      [subjectId, students[0].grade_id]
    );

    res.json({ materials });
  } catch (error) {
    console.error('Get learning materials error:', error);
    res.status(500).json({ error: 'Failed to fetch learning materials' });
  }
});

// Get quizzes for a subject
router.get('/subjects/:id/quizzes', async (req, res) => {
  try {
    const userId = req.user.id;
    const subjectId = req.params.id;

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(`Fetching quizzes for student ${students[0].id}, subject ${subjectId}, grade ${students[0].grade_id}`);

    const [quizzes] = await pool.query(
      `SELECT q.*, 
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
              qs.id as submission_id, qs.total_score, qs.is_graded, qs.submitted_at
       FROM quizzes q
       LEFT JOIN quiz_submissions qs ON q.id = qs.quiz_id AND qs.student_id = ?
       WHERE q.subject_id = ? AND q.grade_id = ? AND q.is_published = TRUE
       ORDER BY q.created_at DESC`,
      [students[0].id, subjectId, students[0].grade_id]
    );

    console.log(`Found ${quizzes.length} quizzes`);

    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get quiz with questions (to take it)
router.get('/quizzes/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.id;

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get quiz
    const [quizzes] = await pool.query(
      'SELECT * FROM quizzes WHERE id = ? AND is_published = TRUE',
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if already submitted
    const [submissions] = await pool.query(
      'SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?',
      [quizId, students[0].id]
    );

    if (submissions.length > 0) {
      return res.status(400).json({ error: 'You have already submitted this quiz' });
    }

    // Get questions (hide correct answers)
    const [questions] = await pool.query(
      `SELECT id, question_text, question_type, points, options, order_number
       FROM quiz_questions
       WHERE quiz_id = ?
       ORDER BY order_number`,
      [quizId]
    );

    res.json({
      quiz: quizzes[0],
      questions
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Submit quiz with auto-grading
router.post('/quizzes/:id/submit', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const quizId = req.params.id;
    const { answers } = req.body; // Array of { questionId, answerText }

    const [students] = await connection.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await connection.beginTransaction();

    // Create submission
    const [submissionResult] = await connection.query(
      `INSERT INTO quiz_submissions (quiz_id, student_id, submitted_at)
       VALUES (?, ?, NOW())`,
      [quizId, students[0].id]
    );

    const submissionId = submissionResult.insertId;

    // Get all questions with correct answers
    const [questions] = await connection.query(
      'SELECT * FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );

    let totalScore = 0;

    // Process each answer
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let pointsEarned = 0;

      // Auto-grade MCQ and True/False
      if (question.question_type === 'mcq' || question.question_type === 'true_false') {
        // Case-insensitive comparison
        isCorrect = answer.answerText.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
        pointsEarned = isCorrect ? question.points : 0;
        totalScore += pointsEarned;
      }

      // Insert answer
      await connection.query(
        `INSERT INTO quiz_answers (submission_id, question_id, answer_text, is_correct, points_earned)
         VALUES (?, ?, ?, ?, ?)`,
        [submissionId, answer.questionId, answer.answerText, isCorrect, pointsEarned]
      );
    }

    // Update submission with score
    const isFullyGraded = questions.every(q => q.question_type === 'mcq' || q.question_type === 'true_false');
    await connection.query(
      `UPDATE quiz_submissions SET total_score = ?, is_graded = ? WHERE id = ?`,
      [totalScore, isFullyGraded, submissionId]
    );

    await connection.commit();

    res.json({
      message: 'Quiz submitted successfully',
      submissionId,
      totalScore,
      isGraded: isFullyGraded
    });
  } catch (error) {
    await connection.rollback();
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  } finally {
    connection.release();
  }
});

// Get quiz results
router.get('/quizzes/:id/results', async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = req.params.id;

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get submission
    const [submissions] = await pool.query(
      'SELECT * FROM quiz_submissions WHERE quiz_id = ? AND student_id = ?',
      [quizId, students[0].id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'No submission found' });
    }

    // Get quiz info
    const [quizzes] = await pool.query(
      'SELECT * FROM quizzes WHERE id = ?',
      [quizId]
    );

    // Get answers with questions
    const [answers] = await pool.query(
      `SELECT qa.*, qq.question_text, qq.question_type, qq.correct_answer, qq.points as question_points
       FROM quiz_answers qa
       INNER JOIN quiz_questions qq ON qa.question_id = qq.id
       WHERE qa.submission_id = ?
       ORDER BY qq.order_number`,
      [submissions[0].id]
    );

    res.json({
      quiz: quizzes[0],
      submission: submissions[0],
      answers
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

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [tests] = await pool.query(
      `SELECT t.*, 
              (SELECT COUNT(*) FROM test_questions WHERE test_id = t.id) as question_count,
              ts.id as submission_id, ts.total_score, ts.is_graded, ts.submitted_at
       FROM tests t
       LEFT JOIN test_submissions ts ON t.id = ts.test_id AND ts.student_id = ?
       WHERE t.subject_id = ? AND t.grade_id = ? AND t.is_published = TRUE
       ORDER BY t.created_at DESC`,
      [students[0].id, subjectId, students[0].grade_id]
    );

    res.json({ tests });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Get test with questions (to take it)
router.get('/tests/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = req.params.id;

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get test
    const [tests] = await pool.query(
      'SELECT * FROM tests WHERE id = ? AND is_published = TRUE',
      [testId]
    );

    if (tests.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check if already submitted
    const [submissions] = await pool.query(
      'SELECT * FROM test_submissions WHERE test_id = ? AND student_id = ?',
      [testId, students[0].id]
    );

    if (submissions.length > 0) {
      return res.status(400).json({ error: 'You have already submitted this test' });
    }

    // Get questions (hide correct answers)
    const [questions] = await pool.query(
      `SELECT id, question_text, question_type, points, options, order_number
       FROM test_questions
       WHERE test_id = ?
       ORDER BY order_number`,
      [testId]
    );

    res.json({
      test: tests[0],
      questions
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// Submit test with auto-grading
router.post('/tests/:id/submit', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const testId = req.params.id;
    const { answers } = req.body;

    const [students] = await connection.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await connection.beginTransaction();

    // Create submission
    const [submissionResult] = await connection.query(
      `INSERT INTO test_submissions (test_id, student_id, submitted_at)
       VALUES (?, ?, NOW())`,
      [testId, students[0].id]
    );

    const submissionId = submissionResult.insertId;

    // Get all questions with correct answers
    const [questions] = await connection.query(
      'SELECT * FROM test_questions WHERE test_id = ?',
      [testId]
    );

    let totalScore = 0;

    // Process each answer
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let pointsEarned = 0;

      // Auto-grade MCQ and True/False
      if (question.question_type === 'mcq' || question.question_type === 'true_false') {
        isCorrect = answer.answerText.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
        pointsEarned = isCorrect ? question.points : 0;
        totalScore += pointsEarned;
      }

      // Insert answer
      await connection.query(
        `INSERT INTO test_answers (submission_id, question_id, answer_text, is_correct, points_earned)
         VALUES (?, ?, ?, ?, ?)`,
        [submissionId, answer.questionId, answer.answerText, isCorrect, pointsEarned]
      );
    }

    // Check if test has essay questions needing manual grading
    const hasEssayQuestions = questions.some(q => q.question_type === 'short_answer' || q.question_type === 'long_answer');
    const isFullyGraded = !hasEssayQuestions;

    // Update submission with score
    await connection.query(
      `UPDATE test_submissions SET total_score = ?, is_graded = ? WHERE id = ?`,
      [totalScore, isFullyGraded, submissionId]
    );

    await connection.commit();

    res.json({
      message: 'Test submitted successfully',
      submissionId,
      totalScore,
      isGraded: isFullyGraded
    });
  } catch (error) {
    await connection.rollback();
    console.error('Submit test error:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  } finally {
    connection.release();
  }
});

// Get test results
router.get('/tests/:id/results', async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = req.params.id;

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get submission
    const [submissions] = await pool.query(
      'SELECT * FROM test_submissions WHERE test_id = ? AND student_id = ?',
      [testId, students[0].id]
    );

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'No submission found' });
    }

    // Get test info
    const [tests] = await pool.query(
      'SELECT * FROM tests WHERE id = ?',
      [testId]
    );

    // Get answers with questions
    const [answers] = await pool.query(
      `SELECT ta.*, tq.question_text, tq.question_type, tq.correct_answer, tq.points as question_points
       FROM test_answers ta
       INNER JOIN test_questions tq ON ta.question_id = tq.id
       WHERE ta.submission_id = ?
       ORDER BY tq.order_number`,
      [submissions[0].id]
    );

    res.json({
      test: tests[0],
      submission: submissions[0],
      answers
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

    const [students] = await pool.query(
      'SELECT * FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [resources] = await pool.query(
      `SELECT ar.*, u.full_name as teacher_name
       FROM additional_resources ar
       INNER JOIN teachers t ON ar.teacher_id = t.id
       INNER JOIN users u ON t.user_id = u.id
       WHERE ar.subject_id = ? AND ar.grade_id = ?
       ORDER BY ar.created_at DESC`,
      [subjectId, students[0].grade_id]
    );

    res.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

export default router;
