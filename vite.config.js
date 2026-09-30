import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  // publicDir defaults to 'public' - place static files like logo.png there
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        results: 'results.html',
        studentResult: 'student-result.html',
        adminLogin: 'admin-login.html',
        adminDashboard: 'admin-dashboard.html',
        students: 'students.html',
        addStudent: 'add-student.html',
        editStudent: 'edit-student.html',
        resultsManagement: 'results-management.html',
        studentResultAdmin: 'student-result-admin.html',
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
