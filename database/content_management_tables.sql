-- ============================================
-- Content Management Tables for TeachWave
-- Learning Materials, Tests, Quizzes, Resources
-- ============================================

USE teachwave;

-- Learning Materials (uploaded by teachers)
CREATE TABLE IF NOT EXISTS learning_materials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INT NOT NULL,
  grade_id INT NOT NULL,
  teacher_id INT NOT NULL,
  file_url VARCHAR(500),
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_subject_grade (subject_id, grade_id)
);

-- Tests
CREATE TABLE IF NOT EXISTS tests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INT NOT NULL,
  grade_id INT NOT NULL,
  teacher_id INT NOT NULL,
  total_points INT DEFAULT 100,
  duration_minutes INT,
  due_date DATETIME,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_subject_grade (subject_id, grade_id)
);

-- Test Questions
CREATE TABLE IF NOT EXISTS test_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('mcq', 'true_false', 'short_answer', 'long_answer') NOT NULL,
  points INT DEFAULT 1,
  correct_answer TEXT,
  options JSON,
  order_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  INDEX idx_test (test_id)
);

-- Test Submissions
CREATE TABLE IF NOT EXISTS test_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  test_id INT NOT NULL,
  student_id INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  total_score INT,
  is_graded BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_test (student_id, test_id),
  INDEX idx_test (test_id),
  INDEX idx_student (student_id)
);

-- Test Answers
CREATE TABLE IF NOT EXISTS test_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  submission_id INT NOT NULL,
  question_id INT NOT NULL,
  answer_text TEXT,
  is_correct BOOLEAN,
  points_earned INT DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES test_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission_question (submission_id, question_id)
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INT NOT NULL,
  grade_id INT NOT NULL,
  teacher_id INT NOT NULL,
  total_points INT DEFAULT 10,
  time_limit_minutes INT DEFAULT 15,
  due_date DATETIME,
  is_published BOOLEAN DEFAULT FALSE,
  auto_grade BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_subject_grade (subject_id, grade_id)
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('mcq', 'true_false', 'short_answer') NOT NULL,
  points INT DEFAULT 1,
  correct_answer TEXT,
  options JSON,
  order_number INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_quiz (quiz_id)
);

-- Quiz Submissions
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  total_score INT,
  is_graded BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_quiz (student_id, quiz_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_student (student_id)
);

-- Quiz Answers
CREATE TABLE IF NOT EXISTS quiz_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  submission_id INT NOT NULL,
  question_id INT NOT NULL,
  answer_text TEXT,
  is_correct BOOLEAN,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission_question (submission_id, question_id)
);

-- Additional Resources
CREATE TABLE IF NOT EXISTS additional_resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INT NOT NULL,
  grade_id INT NOT NULL,
  teacher_id INT NOT NULL,
  resource_type ENUM('document', 'video', 'link', 'file') DEFAULT 'file',
  file_url VARCHAR(500),
  external_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_subject_grade (subject_id, grade_id)
);
