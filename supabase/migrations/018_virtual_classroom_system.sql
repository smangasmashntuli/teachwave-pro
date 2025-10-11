-- Virtual Classroom System Migration
-- This migration adds support for real-time virtual classrooms with chat and attendance



-- Virtual Classroom System Drop Statements
-- This script removes all virtual classroom tables, indexes, policies, functions, and triggers

-- Drop triggers first (only the virtual_classes specific one)
DROP TRIGGER IF EXISTS update_virtual_classes_updated_at ON virtual_classes;

-- Drop functions (only the virtual_classes specific one, leave update_updated_at_column since it's used elsewhere)
DROP FUNCTION IF EXISTS auto_end_classes();

-- Disable RLS and drop policies (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_recordings') THEN
        ALTER TABLE class_recordings DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "class_recordings_insert_teacher" ON class_recordings;
        DROP POLICY IF EXISTS "class_recordings_read_class_members" ON class_recordings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_chat') THEN
        ALTER TABLE class_chat DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "class_chat_insert_participants" ON class_chat;
        DROP POLICY IF EXISTS "class_chat_read_class_members" ON class_chat;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_attendance') THEN
        ALTER TABLE class_attendance DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "class_attendance_update_own" ON class_attendance;
        DROP POLICY IF EXISTS "class_attendance_insert_own" ON class_attendance;
        DROP POLICY IF EXISTS "class_attendance_read_class_members" ON class_attendance;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'virtual_classes') THEN
        ALTER TABLE virtual_classes DISABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "virtual_classes_update_own" ON virtual_classes;
        DROP POLICY IF EXISTS "virtual_classes_insert_teacher" ON virtual_classes;
        DROP POLICY IF EXISTS "virtual_classes_read_own" ON virtual_classes;
    END IF;
END $$;

-- Drop indexes
DROP INDEX IF EXISTS idx_class_chat_created;
DROP INDEX IF EXISTS idx_class_chat_sender;
DROP INDEX IF EXISTS idx_class_chat_class;

DROP INDEX IF EXISTS idx_class_attendance_status;
DROP INDEX IF EXISTS idx_class_attendance_student;
DROP INDEX IF EXISTS idx_class_attendance_class;

DROP INDEX IF EXISTS idx_virtual_classes_scheduled_start;
DROP INDEX IF EXISTS idx_virtual_classes_status;
DROP INDEX IF EXISTS idx_virtual_classes_teacher;
DROP INDEX IF EXISTS idx_virtual_classes_subject;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS class_recordings CASCADE;
DROP TABLE IF EXISTS class_chat CASCADE;
DROP TABLE IF EXISTS class_attendance CASCADE;
DROP TABLE IF EXISTS virtual_classes CASCADE;

-- Remove sample data (optional - only if you want to clean up test data)
DELETE FROM virtual_classes 
WHERE title LIKE 'Introduction to %' 
AND description LIKE 'Getting started with % fundamentals';





-- Create virtual_classes table
CREATE TABLE IF NOT EXISTS virtual_classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    meeting_url TEXT,
    recording_url TEXT,
    attendance_code TEXT,
    max_participants INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_attendance table for tracking who joins classes
CREATE TABLE IF NOT EXISTS class_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES virtual_classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    video_enabled BOOLEAN DEFAULT true,
    audio_enabled BOOLEAN DEFAULT true,
    connection_quality TEXT DEFAULT 'good',
    UNIQUE(class_id, student_id)
);

-- Create class_chat table for real-time messaging
CREATE TABLE IF NOT EXISTS class_chat (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES virtual_classes(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_recordings table for storing class recordings
CREATE TABLE IF NOT EXISTS class_recordings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    class_id UUID REFERENCES virtual_classes(id) ON DELETE CASCADE,
    recording_url TEXT NOT NULL,
    duration INTEGER, -- in seconds
    file_size BIGINT, -- in bytes
    quality TEXT DEFAULT 'hd',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_virtual_classes_subject ON virtual_classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_teacher ON virtual_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_status ON virtual_classes(status);
CREATE INDEX IF NOT EXISTS idx_virtual_classes_scheduled_start ON virtual_classes(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_class_attendance_class ON class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_student ON class_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_status ON class_attendance(status);

CREATE INDEX IF NOT EXISTS idx_class_chat_class ON class_chat(class_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_sender ON class_chat(sender_id);
CREATE INDEX IF NOT EXISTS idx_class_chat_created ON class_chat(created_at);

-- Add RLS policies
ALTER TABLE virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_recordings ENABLE ROW LEVEL SECURITY;

-- Virtual classes policies
CREATE POLICY "virtual_classes_read_own" ON virtual_classes
    FOR SELECT USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM subject_enrollments se
            WHERE se.subject_id = virtual_classes.subject_id 
            AND se.student_id = auth.uid() 
            AND se.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

CREATE POLICY "virtual_classes_insert_teacher" ON virtual_classes
    FOR INSERT WITH CHECK (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('teacher', 'admin')
        )
    );

CREATE POLICY "virtual_classes_update_own" ON virtual_classes
    FOR UPDATE USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Class attendance policies
CREATE POLICY "class_attendance_read_class_members" ON class_attendance
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM virtual_classes vc
            WHERE vc.id = class_attendance.class_id 
            AND vc.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

CREATE POLICY "class_attendance_insert_own" ON class_attendance
    FOR INSERT WITH CHECK (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM virtual_classes vc
            WHERE vc.id = class_attendance.class_id 
            AND vc.teacher_id = auth.uid()
        )
    );

CREATE POLICY "class_attendance_update_own" ON class_attendance
    FOR UPDATE USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM virtual_classes vc
            WHERE vc.id = class_attendance.class_id 
            AND vc.teacher_id = auth.uid()
        )
    );

-- Class chat policies
CREATE POLICY "class_chat_read_class_members" ON class_chat
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_attendance ca
            WHERE ca.class_id = class_chat.class_id 
            AND ca.student_id = auth.uid()
            AND ca.status = 'present'
        ) OR
        EXISTS (
            SELECT 1 FROM virtual_classes vc
            WHERE vc.id = class_chat.class_id 
            AND vc.teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

CREATE POLICY "class_chat_insert_participants" ON class_chat
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND (
            EXISTS (
                SELECT 1 FROM class_attendance ca
                WHERE ca.class_id = class_chat.class_id 
                AND ca.student_id = auth.uid()
                AND ca.status = 'present'
            ) OR
            EXISTS (
                SELECT 1 FROM virtual_classes vc
                WHERE vc.id = class_chat.class_id 
                AND vc.teacher_id = auth.uid()
            )
        )
    );

-- Class recordings policies  
CREATE POLICY "class_recordings_read_class_members" ON class_recordings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM virtual_classes vc
            WHERE vc.id = class_recordings.class_id 
            AND (
                vc.teacher_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM subject_enrollments se
                    WHERE se.subject_id = vc.subject_id 
                    AND se.student_id = auth.uid() 
                    AND se.is_active = true
                )
            )
        ) OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

CREATE POLICY "class_recordings_insert_teacher" ON class_recordings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM virtual_classes vc
            WHERE vc.id = class_recordings.class_id 
            AND vc.teacher_id = auth.uid()
        )
    );

-- Add updated_at trigger for virtual_classes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_virtual_classes_updated_at 
    BEFORE UPDATE ON virtual_classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically end classes
CREATE OR REPLACE FUNCTION auto_end_classes()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-end classes that have passed their end time
    UPDATE virtual_classes 
    SET status = 'completed' 
    WHERE status = 'ongoing' 
    AND scheduled_end IS NOT NULL 
    AND scheduled_end < NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the auto-end function periodically
-- This would typically be handled by a cron job or scheduled function
-- For now, we'll trigger it on any virtual_classes update

-- Sample data for testing
-- Insert a sample virtual class for each subject that has teacher assignments
INSERT INTO virtual_classes (subject_id, teacher_id, title, description, scheduled_start, scheduled_end, status)
SELECT 
    ta.subject_id,
    ta.teacher_id,
    'Introduction to ' || s.name,
    'Getting started with ' || s.name || ' fundamentals',
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour',
    'scheduled'
FROM teacher_assignments ta
JOIN subjects s ON s.id = ta.subject_id
WHERE ta.is_active = true
ON CONFLICT DO NOTHING;