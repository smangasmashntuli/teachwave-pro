import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// ============================================
// USER MANAGEMENT
// ============================================

// Get all users with details
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.created_at,
              s.student_number, s.grade_id, s.subject_group_id,
              t.employee_number, t.specialization,
              g.name as grade_name,
              sg.name as stream_name
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN teachers t ON u.id = t.user_id
       LEFT JOIN grades g ON s.grade_id = g.id
       LEFT JOIN subject_groups sg ON s.subject_group_id = sg.id
       ORDER BY u.created_at DESC`
    );

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email, password, full_name, role, phone, grade_id, subject_group_id, employee_number, specialization } = req.body;

    console.log('Creating user with data:', { email, full_name, role, grade_id, subject_group_id });

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Missing required fields: email, password, full_name, and role are required' });
    }

    // Validate student-specific fields
    if (role === 'student') {
      if (!grade_id) {
        return res.status(400).json({ error: 'Grade is required for students' });
      }
      // For Grade 10-12, subject_group_id is required
      if (grade_id > 2 && !subject_group_id) {
        return res.status(400).json({ error: 'Stream is required for Grade 10-12 students' });
      }
    }

    await connection.beginTransaction();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [userResult] = await connection.query(
      'INSERT INTO users (email, password, full_name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, full_name, role, phone || null]
    );

    const userId = userResult.insertId;
    console.log('User created with ID:', userId);

    // Create role-specific record
    if (role === 'student') {
      const studentNumber = `STU${Date.now()}`;
      await connection.query(
        'INSERT INTO students (user_id, student_number, grade_id, subject_group_id) VALUES (?, ?, ?, ?)',
        [userId, studentNumber, grade_id, subject_group_id || null]
      );

      // Auto-enroll in subjects based on grade
      const [studentId] = await connection.query('SELECT id FROM students WHERE user_id = ?', [userId]);
      console.log('Student created with ID:', studentId[0].id);
      
      if (grade_id <= 2) {
        // Grade 8-9: Enroll in all grade subjects
        const [subjects] = await connection.query(
          'SELECT subject_id FROM subject_grade_mappings WHERE grade_id = ?',
          [grade_id]
        );
        
        console.log(`Enrolling in ${subjects.length} subjects for grade ${grade_id}`);
        for (const subject of subjects) {
          await connection.query(
            'INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)',
            [studentId[0].id, subject.subject_id]
          );
        }
      } else if (subject_group_id) {
        // Grade 10-12: Enroll in stream subjects
        const [subjects] = await connection.query(
          'SELECT subject_id FROM subject_group_mappings WHERE subject_group_id = ? AND grade_id = ?',
          [subject_group_id, grade_id]
        );
        
        console.log(`Enrolling in ${subjects.length} subjects for grade ${grade_id} and stream ${subject_group_id}`);
        for (const subject of subjects) {
          await connection.query(
            'INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)',
            [studentId[0].id, subject.subject_id]
          );
        }
      }

      // Create enrollment record
      await connection.query(
        'INSERT INTO student_enrollments (student_id, grade_id, subject_group_id) VALUES (?, ?, ?)',
        [studentId[0].id, grade_id, subject_group_id || null]
      );
    } else if (role === 'teacher') {
      const empNumber = employee_number || `TCH${Date.now()}`;
      await connection.query(
        'INSERT INTO teachers (user_id, employee_number, specialization) VALUES (?, ?, ?)',
        [userId, empNumber, specialization || null]
      );
      console.log('Teacher created with employee number:', empNumber);
    }

    await connection.commit();
    console.log('User created successfully:', userId);
    res.status(201).json({ message: 'User created successfully', userId });
  } catch (error) {
    await connection.rollback();
    console.error('Create user error:', error);
    console.error('Error details:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Email already exists' });
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      res.status(400).json({ error: 'Invalid grade or stream selection' });
    } else {
      res.status(500).json({ error: `Failed to create user: ${error.message}` });
    }
  } finally {
    connection.release();
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { full_name, phone, grade_id, subject_group_id, employee_number, specialization } = req.body;

    await connection.beginTransaction();

    // Update user
    await connection.query(
      'UPDATE users SET full_name = ?, phone = ? WHERE id = ?',
      [full_name, phone, id]
    );

    // Update role-specific data
    const [user] = await connection.query('SELECT role FROM users WHERE id = ?', [id]);
    
    if (user[0].role === 'student') {
      // Get student id
      const [student] = await connection.query('SELECT id, grade_id, subject_group_id FROM students WHERE user_id = ?', [id]);
      
      if (student.length > 0) {
        const oldGrade = student[0].grade_id;
        const oldStream = student[0].subject_group_id;
        
        // Update student record
        await connection.query(
          'UPDATE students SET grade_id = ?, subject_group_id = ? WHERE user_id = ?',
          [grade_id, subject_group_id, id]
        );

        // If grade or stream changed, re-enroll in subjects
        if (oldGrade !== grade_id || oldStream !== subject_group_id) {
          // Remove old enrollments
          await connection.query('DELETE FROM subject_enrollments WHERE student_id = ?', [student[0].id]);
          
          // Add new enrollments
          if (grade_id <= 2) {
            const [subjects] = await connection.query(
              'SELECT subject_id FROM subject_grade_mappings WHERE grade_id = ?',
              [grade_id]
            );
            for (const subject of subjects) {
              await connection.query(
                'INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)',
                [student[0].id, subject.subject_id]
              );
            }
          } else if (subject_group_id) {
            const [subjects] = await connection.query(
              'SELECT subject_id FROM subject_group_mappings WHERE subject_group_id = ? AND grade_id = ?',
              [subject_group_id, grade_id]
            );
            for (const subject of subjects) {
              await connection.query(
                'INSERT INTO subject_enrollments (student_id, subject_id) VALUES (?, ?)',
                [student[0].id, subject.subject_id]
              );
            }
          }

          // Update enrollment record
          await connection.query(
            'UPDATE student_enrollments SET grade_id = ?, subject_group_id = ? WHERE student_id = ?',
            [grade_id, subject_group_id, student[0].id]
          );
        }
      }
    } else if (user[0].role === 'teacher') {
      await connection.query(
        'UPDATE teachers SET employee_number = ?, specialization = ? WHERE user_id = ?',
        [employee_number, specialization, id]
      );
    }

    await connection.commit();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    connection.release();
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// TEACHER ASSIGNMENTS
// ============================================

// Get all teachers with their assignments
router.get('/teachers', async (req, res) => {
  try {
    const [teachers] = await pool.query(
      `SELECT t.id, t.user_id, u.full_name, u.email, t.employee_number, t.specialization
       FROM teachers t
       JOIN users u ON t.user_id = u.id
       ORDER BY u.full_name`
    );

    // Get assignments for each teacher
    for (const teacher of teachers) {
      const [assignments] = await pool.query(
        `SELECT ta.id, ta.subject_id, ta.grade_id, s.name as subject_name, s.code as subject_code,
                g.name as grade_name
         FROM teacher_assignments ta
         JOIN subjects s ON ta.subject_id = s.id
         JOIN grades g ON ta.grade_id = g.id
         WHERE ta.teacher_id = ?
         ORDER BY g.name, s.name`,
        [teacher.id]
      );
      teacher.assignments = assignments;
    }

    res.json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Assign teacher to subject and grade
router.post('/teacher-assignments', async (req, res) => {
  try {
    const { teacher_id, subject_id, grade_id } = req.body;

    if (!teacher_id || !subject_id || !grade_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await pool.query(
      'INSERT INTO teacher_assignments (teacher_id, subject_id, grade_id) VALUES (?, ?, ?)',
      [teacher_id, subject_id, grade_id]
    );

    res.status(201).json({ message: 'Teacher assigned successfully' });
  } catch (error) {
    console.error('Assign teacher error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Teacher already assigned to this subject and grade' });
    } else {
      res.status(500).json({ error: 'Failed to assign teacher' });
    }
  }
});

// Remove teacher assignment
router.delete('/teacher-assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM teacher_assignments WHERE id = ?', [id]);
    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
});

// ============================================
// SUBJECT MANAGEMENT
// ============================================

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const [subjects] = await pool.query(
      `SELECT s.id, s.name, s.code, s.description,
              COUNT(DISTINCT se.student_id) as student_count,
              COUNT(DISTINCT ta.teacher_id) as teacher_count
       FROM subjects s
       LEFT JOIN subject_enrollments se ON s.id = se.subject_id
       LEFT JOIN teacher_assignments ta ON s.id = ta.subject_id
       GROUP BY s.id, s.name, s.code, s.description
       ORDER BY s.name`
    );

    res.json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// Get all grades
router.get('/grades', async (req, res) => {
  try {
    const [grades] = await pool.query('SELECT * FROM grades ORDER BY id');
    res.json({ grades });
  } catch (error) {
    console.error('Get grades error:', error);
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Get all subject groups/streams
router.get('/subject-groups', async (req, res) => {
  try {
    const [groups] = await pool.query('SELECT * FROM subject_groups ORDER BY name');
    res.json({ groups });
  } catch (error) {
    console.error('Get subject groups error:', error);
    res.status(500).json({ error: 'Failed to fetch subject groups' });
  }
});

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const [studentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM students'
    );
    
    const [teacherCount] = await pool.query(
      'SELECT COUNT(*) as count FROM teachers'
    );
    
    const [subjectCount] = await pool.query(
      'SELECT COUNT(*) as count FROM subjects'
    );
    
    const [assignmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM assignments'
    );

    // Get students by grade
    const [studentsByGrade] = await pool.query(
      `SELECT g.name as grade, COUNT(s.id) as count
       FROM grades g
       LEFT JOIN students s ON g.id = s.grade_id
       GROUP BY g.id, g.name
       ORDER BY g.id`
    );

    // Get students by stream (Grade 10-12)
    const [studentsByStream] = await pool.query(
      `SELECT sg.name as stream, COUNT(s.id) as count
       FROM subject_groups sg
       LEFT JOIN students s ON sg.id = s.subject_group_id
       GROUP BY sg.id, sg.name
       ORDER BY sg.name`
    );

    res.json({
      stats: {
        totalStudents: studentCount[0].count,
        totalTeachers: teacherCount[0].count,
        totalSubjects: subjectCount[0].count,
        totalAssignments: assignmentCount[0].count,
        studentsByGrade,
        studentsByStream
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get activity logs (recent activities)
router.get('/activities', async (req, res) => {
  try {
    const [recentUsers] = await pool.query(
      `SELECT full_name, email, role, created_at as activity_time, 'User Created' as activity_type
       FROM users
       ORDER BY created_at DESC
       LIMIT 20`
    );

    const [recentAssignments] = await pool.query(
      `SELECT u.full_name, s.name as subject_name, g.name as grade_name, 
              ta.assigned_date as activity_time, 'Teacher Assigned' as activity_type
       FROM teacher_assignments ta
       JOIN teachers t ON ta.teacher_id = t.id
       JOIN users u ON t.user_id = u.id
       JOIN subjects s ON ta.subject_id = s.id
       JOIN grades g ON ta.grade_id = g.id
       ORDER BY ta.assigned_date DESC
       LIMIT 20`
    );

    const activities = [...recentUsers, ...recentAssignments]
      .sort((a, b) => new Date(b.activity_time) - new Date(a.activity_time))
      .slice(0, 20);

    res.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;
