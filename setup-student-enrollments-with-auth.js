/**
 * Setup student enrollments with proper authentication
 * This script creates the connection between students and subjects
 * so students can see assignments and materials uploaded by teachers
 */

import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStudentEnrollments() {
  console.log('🎓 Setting up student-subject enrollments...\n')

  try {
    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'student')

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError)
      return
    }

    console.log(`📚 Found ${students.length} students:`)
    students.forEach(student => {
      console.log(`  - ${student.full_name} (${student.email})`)
    })
    console.log('')

    // Get available subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, name, grade')
      .order('grade', { ascending: true })
      .limit(10) // Start with first 10 subjects

    if (subjectsError) {
      console.error('❌ Error fetching subjects:', subjectsError)
      return
    }

    console.log(`📖 Found ${subjects.length} subjects to enroll in:`)
    subjects.forEach(subject => {
      console.log(`  - ${subject.name} (Grade ${subject.grade})`)
    })
    console.log('')

    // Create enrollments for each student
    let enrollmentsCreated = 0
    let errors = 0

    for (const student of students) {
      console.log(`📝 Enrolling ${student.full_name}...`)
      
      for (const subject of subjects) {
        try {
          // Use service role to bypass RLS and create enrollment directly
          const { data, error } = await supabase
            .from('subject_enrollments')
            .insert({
              student_id: student.id,
              subject_id: subject.id,
              enrolled_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            })
            .select()

          if (error) {
            console.error(`  ❌ Error enrolling in ${subject.name}:`, error.message)
            errors++
          } else {
            console.log(`  ✅ Enrolled in ${subject.name}`)
            enrollmentsCreated++
          }
        } catch (err) {
          console.error(`  ❌ Exception enrolling in ${subject.name}:`, err.message)
          errors++
        }
      }
      console.log('')
    }

    console.log('📊 Summary:')
    console.log(`  ✅ Enrollments created: ${enrollmentsCreated}`)
    console.log(`  ❌ Errors: ${errors}`)

    // Verify enrollments were created
    const { data: verifyEnrollments, error: verifyError } = await supabase
      .from('subject_enrollments')
      .select('*, profiles!student_id(full_name, email), subjects!subject_id(name)')

    if (verifyError) {
      console.error('❌ Error verifying enrollments:', verifyError)
      return
    }

    console.log(`\n🔍 Verification: Found ${verifyEnrollments.length} total enrollments:`)
    verifyEnrollments.forEach(enrollment => {
      console.log(`  - ${enrollment.profiles.full_name} enrolled in ${enrollment.subjects.name}`)
    })

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the setup
setupStudentEnrollments()