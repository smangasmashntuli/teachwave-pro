import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All routes require authentication
router.use(authenticateToken);

// ==========================================
// TEACHER ROUTES
// ==========================================

// Create a new virtual class (Teachers only)
router.post('/create', authorizeRoles('teacher'), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      class_name,
      subject_id,
      grade_id,
      scheduled_start,
      scheduled_end,
      description,
      recording_enabled
    } = req.body;

    // Get teacher ID
    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Generate unique room ID
    const room_id = crypto.randomBytes(16).toString('hex');
    const meeting_url = `/virtual-classroom/${room_id}`;

    const [result] = await pool.query(
      `INSERT INTO virtual_classes 
       (class_name, subject_id, teacher_id, grade_id, scheduled_start, scheduled_end, 
        room_id, meeting_url, recording_enabled, description, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      [
        class_name,
        subject_id,
        teachers[0].id,
        grade_id,
        scheduled_start,
        scheduled_end,
        room_id,
        meeting_url,
        recording_enabled || false,
        description
      ]
    );

    res.status(201).json({
      message: 'Virtual class created successfully',
      class: {
        id: result.insertId,
        room_id,
        meeting_url
      }
    });
  } catch (error) {
    console.error('Create virtual class error:', error);
    res.status(500).json({ error: 'Failed to create virtual class' });
  }
});

// Get teacher's virtual classes
router.get('/teacher/classes', authorizeRoles('teacher'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    let query = `
      SELECT vc.*, 
             s.name as subject_name, 
             g.name as grade_name,
             COUNT(DISTINCT a.id) as attendance_count,
             COUNT(DISTINCT vcr.id) as recordings_count
      FROM virtual_classes vc
      INNER JOIN subjects s ON vc.subject_id = s.id
      INNER JOIN grades g ON vc.grade_id = g.id
      LEFT JOIN attendance a ON vc.id = a.class_id AND a.status = 'present'
      LEFT JOIN virtual_class_recordings vcr ON vc.id = vcr.class_id
      WHERE vc.teacher_id = ?
    `;

    const params = [teachers[0].id];

    if (status) {
      query += ' AND vc.status = ?';
      params.push(status);
    }

    query += ` 
      GROUP BY vc.id 
      ORDER BY vc.scheduled_start DESC
    `;

    const [classes] = await pool.query(query, params);

    res.json({ classes });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Start a virtual class
router.put('/start/:classId', authorizeRoles('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    const [classes] = await pool.query(
      'SELECT * FROM virtual_classes WHERE id = ? AND teacher_id = ?',
      [classId, teachers[0].id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update class status to live
    await pool.query(
      `UPDATE virtual_classes 
       SET status = 'live', actual_start = NOW() 
       WHERE id = ?`,
      [classId]
    );

    res.json({ message: 'Class started successfully' });
  } catch (error) {
    console.error('Start class error:', error);
    res.status(500).json({ error: 'Failed to start class' });
  }
});

// End a virtual class
router.put('/end/:classId', authorizeRoles('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    const [classes] = await pool.query(
      'SELECT * FROM virtual_classes WHERE id = ? AND teacher_id = ?',
      [classId, teachers[0].id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update class status to completed
    await pool.query(
      `UPDATE virtual_classes 
       SET status = 'completed', actual_end = NOW(), is_recording = FALSE 
       WHERE id = ?`,
      [classId]
    );

    // Update all active attendees' leave time
    await pool.query(
      `UPDATE attendance 
       SET leave_time = NOW() 
       WHERE class_id = ? AND leave_time IS NULL`,
      [classId]
    );

    res.json({ message: 'Class ended successfully' });
  } catch (error) {
    console.error('End class error:', error);
    res.status(500).json({ error: 'Failed to end class' });
  }
});

// Start/Stop recording
router.put('/recording/:classId', authorizeRoles('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { isRecording } = req.body;
    const userId = req.user.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    const [classes] = await pool.query(
      'SELECT * FROM virtual_classes WHERE id = ? AND teacher_id = ?',
      [classId, teachers[0].id]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (!classes[0].recording_enabled) {
      return res.status(400).json({ error: 'Recording not enabled for this class' });
    }

    await pool.query(
      'UPDATE virtual_classes SET is_recording = ? WHERE id = ?',
      [isRecording, classId]
    );

    res.json({ 
      message: isRecording ? 'Recording started' : 'Recording stopped',
      isRecording 
    });
  } catch (error) {
    console.error('Recording toggle error:', error);
    res.status(500).json({ error: 'Failed to toggle recording' });
  }
});

// ==========================================
// STUDENT ROUTES
// ==========================================

// Get student's virtual classes
router.get('/student/classes', authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const [students] = await pool.query(
      'SELECT id, grade_id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get classes for subjects the student is enrolled in
    let query = `
      SELECT DISTINCT vc.*, 
             s.name as subject_name,
             g.name as grade_name,
             u.full_name as teacher_name,
             a.status as my_attendance,
             a.join_time as my_join_time,
             COUNT(DISTINCT vcr.id) as recordings_count
      FROM virtual_classes vc
      INNER JOIN subjects s ON vc.subject_id = s.id
      INNER JOIN grades g ON vc.grade_id = g.id
      INNER JOIN teachers t ON vc.teacher_id = t.id
      INNER JOIN users u ON t.user_id = u.id
      INNER JOIN subject_enrollments se ON s.id = se.subject_id
      LEFT JOIN attendance a ON vc.id = a.class_id AND a.student_id = ?
      LEFT JOIN virtual_class_recordings vcr ON vc.id = vcr.class_id
      WHERE se.student_id = ? AND se.is_active = TRUE AND vc.grade_id = ?
    `;

    const params = [students[0].id, students[0].id, students[0].grade_id];

    if (status) {
      query += ' AND vc.status = ?';
      params.push(status);
    }

    query += `
      GROUP BY vc.id
      ORDER BY vc.scheduled_start DESC
    `;

    const [classes] = await pool.query(query, params);

    res.json({ classes });
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Join a virtual class
router.post('/join/:classId', authorizeRoles('student'), async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if class exists and is live
    const [classes] = await pool.query(
      'SELECT * FROM virtual_classes WHERE id = ?',
      [classId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (classes[0].status !== 'live' && classes[0].status !== 'scheduled') {
      return res.status(400).json({ error: 'Class is not available' });
    }

    // Record attendance
    await pool.query(
      `INSERT INTO attendance (class_id, student_id, status, join_time) 
       VALUES (?, ?, 'present', NOW())
       ON DUPLICATE KEY UPDATE join_time = NOW(), status = 'present'`,
      [classId, students[0].id]
    );

    res.json({ 
      message: 'Joined class successfully',
      room_id: classes[0].room_id 
    });
  } catch (error) {
    console.error('Join class error:', error);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

// Leave a virtual class
router.post('/leave/:classId', authorizeRoles('student'), async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update leave time
    await pool.query(
      `UPDATE attendance 
       SET leave_time = NOW() 
       WHERE class_id = ? AND student_id = ? AND leave_time IS NULL`,
      [classId, students[0].id]
    );

    res.json({ message: 'Left class successfully' });
  } catch (error) {
    console.error('Leave class error:', error);
    res.status(500).json({ error: 'Failed to leave class' });
  }
});

// ==========================================
// SHARED ROUTES (Teacher & Student)
// ==========================================

// Get class details by room ID
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    const [classes] = await pool.query(
      `SELECT vc.*, 
              s.name as subject_name,
              g.name as grade_name,
              u.full_name as teacher_name,
              u.id as teacher_user_id
       FROM virtual_classes vc
       INNER JOIN subjects s ON vc.subject_id = s.id
       INNER JOIN grades g ON vc.grade_id = g.id
       INNER JOIN teachers t ON vc.teacher_id = t.id
       INNER JOIN users u ON t.user_id = u.id
       WHERE vc.room_id = ?`,
      [roomId]
    );

    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ class: classes[0] });
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

// Get class participants
router.get('/participants/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const [participants] = await pool.query(
      `SELECT u.id, u.full_name, u.avatar_url, a.status, a.join_time, a.leave_time
       FROM attendance a
       INNER JOIN students s ON a.student_id = s.id
       INNER JOIN users u ON s.user_id = u.id
       WHERE a.class_id = ?
       ORDER BY a.join_time DESC`,
      [classId]
    );

    res.json({ participants });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// ==========================================
// RECORDING ROUTES
// ==========================================

// Save recording metadata
router.post('/recording/save', authorizeRoles('teacher'), async (req, res) => {
  try {
    const {
      class_id,
      recording_name,
      file_path,
      file_size,
      duration,
      recording_started_at,
      recording_ended_at
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO virtual_class_recordings 
       (class_id, recording_name, file_path, file_size, duration, 
        recording_started_at, recording_ended_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [class_id, recording_name, file_path, file_size, duration, 
       recording_started_at, recording_ended_at]
    );

    res.status(201).json({
      message: 'Recording saved successfully',
      recording: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Save recording error:', error);
    res.status(500).json({ error: 'Failed to save recording' });
  }
});

// Get recordings for a class
router.get('/recordings/:classId', async (req, res) => {
  try {
    const { classId } = req.params;

    const [recordings] = await pool.query(
      `SELECT vcr.*, vc.class_name, s.name as subject_name
       FROM virtual_class_recordings vcr
       INNER JOIN virtual_classes vc ON vcr.class_id = vc.id
       INNER JOIN subjects s ON vc.subject_id = s.id
       WHERE vcr.class_id = ? AND vcr.is_available = TRUE
       ORDER BY vcr.created_at DESC`,
      [classId]
    );

    res.json({ recordings });
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// Get all recordings for teacher
router.get('/teacher/recordings', authorizeRoles('teacher'), async (req, res) => {
  try {
    const userId = req.user.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const [recordings] = await pool.query(
      `SELECT vcr.*, 
              vc.class_name,
              vc.scheduled_start,
              s.name as subject_name,
              g.name as grade_name
       FROM virtual_class_recordings vcr
       INNER JOIN virtual_classes vc ON vcr.class_id = vc.id
       INNER JOIN subjects s ON vc.subject_id = s.id
       INNER JOIN grades g ON vc.grade_id = g.id
       WHERE vc.teacher_id = ? AND vcr.is_available = TRUE
       ORDER BY vcr.created_at DESC`,
      [teachers[0].id]
    );

    res.json({ recordings });
  } catch (error) {
    console.error('Get teacher recordings error:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// Get all recordings for student
router.get('/student/recordings', authorizeRoles('student'), async (req, res) => {
  try {
    const userId = req.user.id;

    const [students] = await pool.query(
      'SELECT id, grade_id FROM students WHERE user_id = ?',
      [userId]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [recordings] = await pool.query(
      `SELECT DISTINCT vcr.*, 
              vc.class_name,
              vc.scheduled_start,
              s.name as subject_name,
              g.name as grade_name,
              u.full_name as teacher_name
       FROM virtual_class_recordings vcr
       INNER JOIN virtual_classes vc ON vcr.class_id = vc.id
       INNER JOIN subjects s ON vc.subject_id = s.id
       INNER JOIN grades g ON vc.grade_id = g.id
       INNER JOIN teachers t ON vc.teacher_id = t.id
       INNER JOIN users u ON t.user_id = u.id
       INNER JOIN subject_enrollments se ON s.id = se.subject_id
       WHERE se.student_id = ? AND se.is_active = TRUE 
             AND vc.grade_id = ? AND vcr.is_available = TRUE
       ORDER BY vcr.created_at DESC`,
      [students[0].id, students[0].grade_id]
    );

    res.json({ recordings });
  } catch (error) {
    console.error('Get student recordings error:', error);
    res.status(500).json({ error: 'Failed to fetch recordings' });
  }
});

// Increment recording views
router.post('/recording/:recordingId/view', async (req, res) => {
  try {
    const { recordingId } = req.params;

    await pool.query(
      'UPDATE virtual_class_recordings SET views_count = views_count + 1 WHERE id = ?',
      [recordingId]
    );

    res.json({ message: 'View counted' });
  } catch (error) {
    console.error('Increment view error:', error);
    res.status(500).json({ error: 'Failed to increment view' });
  }
});

// Delete recording (Teacher only)
router.delete('/recording/:recordingId', authorizeRoles('teacher'), async (req, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.user.id;

    const [teachers] = await pool.query(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    // Verify ownership
    const [recordings] = await pool.query(
      `SELECT vcr.*, vc.teacher_id 
       FROM virtual_class_recordings vcr
       INNER JOIN virtual_classes vc ON vcr.class_id = vc.id
       WHERE vcr.id = ?`,
      [recordingId]
    );

    if (recordings.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    if (recordings[0].teacher_id !== teachers[0].id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark as unavailable instead of deleting
    await pool.query(
      'UPDATE virtual_class_recordings SET is_available = FALSE WHERE id = ?',
      [recordingId]
    );

    res.json({ message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Delete recording error:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
});

// ==========================================
// CHAT ROUTES
// ==========================================

// Save chat message
router.post('/chat/message', async (req, res) => {
  try {
    const { class_id, message, message_type, metadata } = req.body;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO virtual_class_messages 
       (class_id, user_id, message, message_type, metadata) 
       VALUES (?, ?, ?, ?, ?)`,
      [class_id, userId, message, message_type || 'text', metadata ? JSON.stringify(metadata) : null]
    );

    res.status(201).json({ message: 'Message saved' });
  } catch (error) {
    console.error('Save message error:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get chat history
router.get('/chat/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 100, before } = req.query;

    let query = `
      SELECT vcm.*, u.full_name as user_name, u.role as user_role, u.avatar_url
      FROM virtual_class_messages vcm
      INNER JOIN users u ON vcm.user_id = u.id
      WHERE vcm.class_id = ?
    `;

    const params = [classId];

    if (before) {
      query += ' AND vcm.created_at < ?';
      params.push(before);
    }

    query += ' ORDER BY vcm.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [messages] = await pool.query(query, params);

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

export default router;
