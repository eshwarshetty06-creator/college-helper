# SIT-TUMKUR Navigation Map

## File Structure & Navigation Flow

### Main Entry Point
- **index.html** - Landing page with links to Student and Admin login

### Student Flow
1. **index.html** → Click "Student Login / Sign Up"
2. **student_login.html** - Student login/signup page
   - Links: Home (index.html) | Admin Login
3. **student_home.html** - Student dashboard
   - Features: Classrooms, Announcements, Lost & Found, Book Study Room, My Bookings, Report Issue, My Issues

### Admin Flow
1. **index.html** → Click "Admin Login"
2. **admin_login.html** - Admin login page
   - Links: Home (index.html) | Student Login
3. **admin_home.html** - Admin dashboard
   - Features: Manage Classrooms, Announcements, Lost & Found, Study Room Bookings, View Issues

## All Links Verified ✅

- index.html → student_login.html ✅
- index.html → admin_login.html ✅
- student_login.html → index.html ✅
- student_login.html → admin_login.html ✅
- admin_login.html → index.html ✅
- admin_login.html → student_login.html ✅

## File Dependencies

### HTML Files
- index.html
- student_login.html
- student_home.html
- admin_login.html
- admin_home.html

### JavaScript Files
- js/auth_student.js (for student_login.html & student_home.html)
- js/auth_admin.js (for admin_login.html & admin_home.html)
- js/auth.js (legacy - not currently used)

### CSS Files
- css/common.css (used by all pages)


