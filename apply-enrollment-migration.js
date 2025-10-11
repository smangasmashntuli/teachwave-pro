/**
 * Apply migration to create student enrollments
 * This fixes the teacher-student content visibility issue
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read the migration file
const migrationPath = join(__dirname, 'supabase', 'migrations', '025_create_student_enrollments.sql')
let migrationSQL

try {
  migrationSQL = readFileSync(migrationPath, 'utf8')
  console.log('✅ Migration file loaded successfully')
  console.log('📄 File path:', migrationPath)
  console.log('📏 SQL length:', migrationSQL.length, 'characters')
  console.log('')
} catch (error) {
  console.error('❌ Error reading migration file:', error.message)
  process.exit(1)
}

console.log('📋 MIGRATION CONTENTS:')
console.log('=' + '='.repeat(50))
console.log(migrationSQL)
console.log('=' + '='.repeat(50))
console.log('')

console.log('🔧 TO APPLY THIS MIGRATION:')
console.log('1. Open your Supabase Dashboard')
console.log('2. Go to the SQL Editor')
console.log('3. Copy and paste the SQL shown above')
console.log('4. Click "Run" to execute the migration')
console.log('5. Check the output for the enrollment results')
console.log('')

console.log('📊 This migration will:')
console.log('  ✅ Create enrollments for all students in first 10 subjects')
console.log('  ✅ Fix the teacher-student content visibility issue')
console.log('  ✅ Show detailed progress and results')
console.log('  ✅ Temporarily disable RLS to allow enrollment creation')
console.log('  ✅ Re-enable RLS after enrollments are created')
console.log('')

console.log('🎯 Expected result: Students will now be able to see assignments and materials uploaded by teachers')

console.log('\\n🔍 After running the migration, you can verify with:')
console.log('   node debug-teacher-student-connection.js')