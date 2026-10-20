import mongoose from 'mongoose';
import dns from 'node:dns';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import {
  User,
  StudentProfile,
  FacultyProfile,
  Department,
  Course,
  Enrollment,
  AttendanceSession,
  AttendanceRecord,
  Assignment,
  Submission,
  Assessment,
  AssessmentAttempt,
  Grade,
  StudyMaterial,
  DocumentChunk,
  JobPosting,
  Announcement,
  Notification,
  CareerProfile
} from '../src/models/index.js';
import { tokenize } from '../src/services/ragService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartcampus';

async function seedDatabase() {
  try {
    console.log(`[Seed] Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections for a clean, deterministic seed
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      FacultyProfile.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      AttendanceSession.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Assessment.deleteMany({}),
      AssessmentAttempt.deleteMany({}),
      Grade.deleteMany({}),
      StudyMaterial.deleteMany({}),
      DocumentChunk.deleteMany({}),
      JobPosting.deleteMany({}),
      Announcement.deleteMany({}),
      Notification.deleteMany({}),
      CareerProfile.deleteMany({})
    ]);

    console.log('[Seed] Hashing passwords...');
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin@12345', salt);
    const facultyPass = await bcrypt.hash('Faculty@12345', salt);
    const studentPass = await bcrypt.hash('Student@12345', salt);

    // 1. Create Administrator
    console.log('[Seed] Creating Administrator...');
    const admin = await User.create({
      name: 'Dr. Evelyn Carter',
      email: 'admin@smartcampus.edu',
      passwordHash: adminPass,
      role: 'admin',
      status: 'active',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    });

    // 2. Create Departments
    console.log('[Seed] Creating Departments...');
    const cseDept = await Department.create({
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science, Software Engineering, and AI',
      headOfDepartment: admin._id
    });

    const itDept = await Department.create({
      code: 'IT',
      name: 'Information Technology',
      description: 'Department of Distributed Systems, Cloud Computing, and Cyber Security',
      headOfDepartment: admin._id
    });

    // 3. Create Faculty
    console.log('[Seed] Creating Faculty Members...');
    const drSharma = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'dr.sharma@smartcampus.edu',
      passwordHash: facultyPass,
      role: 'faculty',
      status: 'active',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });

    await FacultyProfile.create({
      userId: drSharma._id,
      facultyId: 'FAC2024001',
      department: 'Computer Science & Engineering',
      designation: 'Associate Professor',
      officeHours: 'Mon, Wed 2:00 PM - 4:00 PM',
      qualifications: ['Ph.D. in Computer Science (Distributed Systems)', 'M.Tech CSE'],
      approvalStatus: 'approved',
      approvedBy: admin._id,
      approvedAt: new Date()
    });

    // Pending Faculty for admin approval demonstration
    const pendingFaculty = await User.create({
      name: 'Prof. Anita Patel',
      email: 'prof.patel@smartcampus.edu',
      passwordHash: facultyPass,
      role: 'faculty',
      status: 'pending',
      isVerified: true
    });

    await FacultyProfile.create({
      userId: pendingFaculty._id,
      facultyId: 'FAC2024002',
      department: 'Information Technology',
      designation: 'Assistant Professor',
      officeHours: 'Tue, Thu 3:00 PM - 5:00 PM',
      qualifications: ['M.Tech in Cybersecurity', 'B.Tech IT'],
      approvalStatus: 'pending'
    });

    // 4. Create Students
    console.log('[Seed] Creating Students...');
    const alex = await User.create({
      name: 'Alex Johnson',
      email: 'alex.student@smartcampus.edu',
      passwordHash: studentPass,
      role: 'student',
      status: 'active',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
    });

    const alexProfile = await StudentProfile.create({
      userId: alex._id,
      studentId: 'STU2024001',
      department: 'Computer Science & Engineering',
      degree: 'B.Tech Computer Science',
      semester: 4,
      academicYear: '2025-2026',
      phone: '+1 (555) 234-5678',
      skills: ['javascript', 'react', 'node.js', 'mongodb', 'python', 'git'],
      careerInterests: ['Full Stack Developer', 'Cloud Architect'],
      cgpa: 8.65,
      totalCredits: 48,
      academicRiskScore: 12,
      academicRiskLevel: 'Low'
    });

    await CareerProfile.create({
      student: alex._id,
      targetRoles: ['Full Stack Developer', 'Software Engineer'],
      extractedSkills: ['javascript', 'react', 'node.js', 'mongodb', 'python'],
      education: [
        {
          degree: 'B.Tech Computer Science & Engineering',
          institution: 'SmartCampus University Institute of Technology',
          year: '2023 - 2027',
          grade: '8.65 CGPA'
        }
      ],
      projects: [
        {
          title: 'Distributed File Storage Engine',
          description: 'Engineered a chunked file storage system using Node.js and MongoDB with cryptographic verification.',
          technologies: ['node.js', 'mongodb', 'docker'],
          link: 'https://github.com/alex-johnson/storage-engine'
        }
      ]
    });

    const sarah = await User.create({
      name: 'Sarah Williams',
      email: 'sarah.student@smartcampus.edu',
      passwordHash: studentPass,
      role: 'student',
      status: 'active',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    });

    await StudentProfile.create({
      userId: sarah._id,
      studentId: 'STU2024002',
      department: 'Computer Science & Engineering',
      degree: 'B.Tech Computer Science',
      semester: 4,
      academicYear: '2025-2026',
      phone: '+1 (555) 876-5432',
      skills: ['python', 'machine learning', 'tensorflow', 'sql'],
      careerInterests: ['Data Scientist', 'AI Research Engineer'],
      cgpa: 9.1,
      totalCredits: 48,
      academicRiskScore: 8,
      academicRiskLevel: 'Low'
    });

    // 5. Create Courses
    console.log('[Seed] Creating Courses...');
    const dsaCourse = await Course.create({
      code: 'CS301',
      name: 'Data Structures & Algorithms',
      department: cseDept._id,
      semester: 4,
      credits: 4,
      description: 'Comprehensive analysis of fundamental algorithms, balanced search trees, graph algorithms, and asymptotic complexity.',
      syllabus: 'Module 1: Asymptotic Analysis & Recurrences\nModule 2: Self-balancing BSTs (AVL & Red-Black)\nModule 3: Graph Traversal (DFS, BFS, Dijkstra, Kruskal)\nModule 4: Dynamic Programming & Greedy Approaches',
      faculty: [drSharma._id],
      schedule: [
        { day: 'Monday', startTime: '10:00 AM', endTime: '11:30 AM', room: 'Hall 301' },
        { day: 'Wednesday', startTime: '10:00 AM', endTime: '11:30 AM', room: 'Hall 301' }
      ]
    });

    const osCourse = await Course.create({
      code: 'CS302',
      name: 'Operating Systems & Architecture',
      department: cseDept._id,
      semester: 4,
      credits: 4,
      description: 'Study of kernel mechanics, virtual memory paging, process scheduling, synchronization primitives, and distributed file systems.',
      syllabus: 'Module 1: Kernel Architecture & System Calls\nModule 2: Process Concurrency, Deadlocks & Semaphores\nModule 3: Virtual Memory Management & Page Replacement\nModule 4: Storage Systems & File System Inodes',
      faculty: [drSharma._id],
      schedule: [
        { day: 'Tuesday', startTime: '02:00 PM', endTime: '03:30 PM', room: 'Lab 2' },
        { day: 'Thursday', startTime: '02:00 PM', endTime: '03:30 PM', room: 'Lab 2' }
      ]
    });

    const aiCourse = await Course.create({
      code: 'CS303',
      name: 'Artificial Intelligence & Neural Networks',
      department: cseDept._id,
      semester: 4,
      credits: 3,
      description: 'Search algorithms, heuristic reasoning, knowledge representation, backpropagation in multilayer perceptrons, and transformers.',
      syllabus: 'Module 1: Intelligent Agents & State Space Search (A* Search)\nModule 2: Adversarial Search (Minimax, Alpha-Beta Pruning)\nModule 3: Neural Networks & Backpropagation\nModule 4: NLP and Retrieval-Augmented Generation (RAG)',
      faculty: [drSharma._id],
      schedule: [
        { day: 'Friday', startTime: '09:00 AM', endTime: '11:00 AM', room: 'Seminar Room 1' }
      ]
    });

    // 6. Enrollments
    console.log('[Seed] Creating Enrollments...');
    await Enrollment.create([
      { student: alex._id, course: dsaCourse._id, semester: 4, academicYear: '2025-2026', status: 'enrolled' },
      { student: alex._id, course: osCourse._id, semester: 4, academicYear: '2025-2026', status: 'enrolled' },
      { student: alex._id, course: aiCourse._id, semester: 4, academicYear: '2025-2026', status: 'enrolled' },
      { student: sarah._id, course: dsaCourse._id, semester: 4, academicYear: '2025-2026', status: 'enrolled' },
      { student: sarah._id, course: osCourse._id, semester: 4, academicYear: '2025-2026', status: 'enrolled' },
      { student: sarah._id, course: aiCourse._id, semester: 4, academicYear: '2025-2026', status: 'enrolled' }
    ]);

    // 7. Attendance Sessions & Records
    console.log('[Seed] Creating Attendance Sessions & Records...');
    const session1 = await AttendanceSession.create({
      course: dsaCourse._id,
      faculty: drSharma._id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      topic: 'Binary Search Trees & AVL Rotations',
      semester: 4,
      sessionType: 'lecture',
      totalStudents: 2,
      presentCount: 2,
      absentCount: 0,
      excusedCount: 0
    });

    const session2 = await AttendanceSession.create({
      course: dsaCourse._id,
      faculty: drSharma._id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      topic: 'Graph Traversal & Shortest Path (Dijkstra)',
      semester: 4,
      sessionType: 'lecture',
      totalStudents: 2,
      presentCount: 2,
      absentCount: 0,
      excusedCount: 0
    });

    const session3 = await AttendanceSession.create({
      course: osCourse._id,
      faculty: drSharma._id,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      topic: 'Process Synchronization & Semaphores',
      semester: 4,
      sessionType: 'lecture',
      totalStudents: 2,
      presentCount: 2,
      absentCount: 0,
      excusedCount: 0
    });

    await AttendanceRecord.create([
      { session: session1._id, course: dsaCourse._id, student: alex._id, status: 'present', markedBy: drSharma._id },
      { session: session1._id, course: dsaCourse._id, student: sarah._id, status: 'present', markedBy: drSharma._id },
      { session: session2._id, course: dsaCourse._id, student: alex._id, status: 'present', markedBy: drSharma._id },
      { session: session2._id, course: dsaCourse._id, student: sarah._id, status: 'present', markedBy: drSharma._id },
      { session: session3._id, course: osCourse._id, student: alex._id, status: 'present', markedBy: drSharma._id },
      { session: session3._id, course: osCourse._id, student: sarah._id, status: 'present', markedBy: drSharma._id }
    ]);

    // 8. Assignments & Submissions
    console.log('[Seed] Creating Assignments...');
    const assign1 = await Assignment.create({
      course: dsaCourse._id,
      faculty: drSharma._id,
      title: 'Implementation of AVL Self-Balancing Trees',
      description: 'Implement an AVL tree from scratch with right and left rotation routines. Analyze performance with 100,000 randomized elements.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      maxMarks: 50,
      allowLateSubmissions: false,
      isPublished: true
    });

    const assign2 = await Assignment.create({
      course: osCourse._id,
      faculty: drSharma._id,
      title: 'Producer-Consumer Synchronization with POSIX Semaphores',
      description: 'Design a thread-safe circular buffer in C or C++ demonstrating avoidance of race conditions and deadlock using semaphores.',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      maxMarks: 50,
      allowLateSubmissions: true,
      isPublished: true
    });

    // Graded submission for Alex
    await Submission.create({
      assignment: assign2._id,
      student: alex._id,
      course: osCourse._id,
      submissionText: 'Implemented circular buffer with pthread mutex locks and counting semaphores. All test benchmarks passed without deadlock.',
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isLate: false,
      status: 'graded',
      marksObtained: 48,
      feedback: 'Excellent synchronization logic and clean thread lifecycle management.',
      gradedBy: drSharma._id,
      gradedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    // 9. Assessments & Attempts
    console.log('[Seed] Creating Assessments...');
    const quiz1 = await Assessment.create({
      course: dsaCourse._id,
      faculty: drSharma._id,
      title: 'Algorithms Mid-Term Mastery Quiz',
      description: 'Test your understanding of tree balance factors, recursion limits, and Big-O notation.',
      durationMinutes: 20,
      totalMarks: 3,
      passingMarks: 2,
      publishStatus: 'published',
      questions: [
        {
          questionText: 'What is the maximum height of an AVL tree with n nodes?',
          options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
          correctOptionIndex: 0,
          marks: 1,
          explanation: 'AVL trees enforce a strict height balance factor of [-1, 0, +1], bounding height strictly to 1.44 log2(n).'
        },
        {
          questionText: 'Which algorithm is best suited for single-source shortest paths on graphs with non-negative weights?',
          options: ['Bellman-Ford', 'Dijkstra with Priority Queue', 'Floyd-Warshall', 'Breadth-First Search without weights'],
          correctOptionIndex: 1,
          marks: 1,
          explanation: 'Dijkstra achieves O((V + E) log V) with a min-heap priority queue when all edge weights are non-negative.'
        },
        {
          questionText: 'What is the worst-case time complexity of quicksort when the pivot is always the extreme element?',
          options: ['O(n log n)', 'O(n)', 'O(n^2)', 'O(2^n)'],
          correctOptionIndex: 2,
          marks: 1,
          explanation: 'When the partition is unbalanced (0 elements on one side), the recursion tree degenerates into depth n, yielding O(n^2).'
        }
      ]
    });

    // Alex's completed attempt
    await AssessmentAttempt.create({
      assessment: quiz1._id,
      student: alex._id,
      course: dsaCourse._id,
      answers: [
        { questionIndex: 0, selectedOptionIndex: 0, isCorrect: true, marksAwarded: 1 },
        { questionIndex: 1, selectedOptionIndex: 1, isCorrect: true, marksAwarded: 1 },
        { questionIndex: 2, selectedOptionIndex: 2, isCorrect: true, marksAwarded: 1 }
      ],
      score: 3,
      totalMarks: 3,
      percentage: 100,
      passed: true,
      timeTakenSeconds: 420,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    // 10. Grades
    console.log('[Seed] Creating Grade Records...');
    await Grade.create([
      {
        student: alex._id,
        course: dsaCourse._id,
        semester: 4,
        academicYear: '2025-2026',
        internalMarks: 28,
        assignmentMarks: 19,
        assessmentMarks: 19,
        endSemMarks: 26,
        totalMarks: 92,
        letterGrade: 'O',
        gpaPoints: 10,
        remarks: 'Outstanding algorithmic problem-solving ability.'
      },
      {
        student: alex._id,
        course: osCourse._id,
        semester: 4,
        academicYear: '2025-2026',
        internalMarks: 26,
        assignmentMarks: 18,
        assessmentMarks: 17,
        endSemMarks: 25,
        totalMarks: 86,
        letterGrade: 'A+',
        gpaPoints: 9,
        remarks: 'Very strong grasp of concurrent programming and system internals.'
      }
    ]);

    // 11. Study Material and RAG Chunks
    console.log('[Seed] Creating Study Materials & RAG Chunks...');
    const studyNotes = await StudyMaterial.create({
      course: dsaCourse._id,
      uploadedBy: drSharma._id,
      title: 'Module 3: Advanced Graph Theory & Network Flows',
      description: 'Comprehensive lecture handouts covering graph representations, Dijkstra, Bellman-Ford, Kruskal, and Prim algorithms.',
      fileUrl: '/uploads/sample_dsa_graphs.pdf',
      fileName: 'sample_dsa_graphs.pdf',
      fileType: 'application/pdf',
      fileSize: 1024 * 350,
      tags: ['graphs', 'algorithms', 'dijkstra', 'mst'],
      isPublic: true,
      chunkCount: 3,
      isProcessed: true
    });

    const chunk1Content = `Graph Theory Fundamentals: A graph G = (V, E) consists of a set of vertices V and edges E.
In an adjacency matrix representation, space complexity is O(V^2), whereas an adjacency list requires O(V + E) space.
For sparse graphs where |E| << |V|^2, the adjacency list is significantly more memory efficient and allows faster neighbor iteration.`;

    const chunk2Content = `Dijkstra's Shortest Path Algorithm: Solves the single-source shortest path problem on a weighted directed or undirected graph with non-negative edge weights.
Using a binary min-heap priority queue, Dijkstra's algorithm operates in O((|V| + |E|) log |V|) time.
The algorithm maintains a tentative distance array and greedily visits the unvisited vertex with the minimum tentative distance.`;

    const chunk3Content = `Minimum Spanning Tree (MST):
A Minimum Spanning Tree of an undirected weighted graph connects all vertices with minimum possible total edge weight without forming cycles.
Kruskal's algorithm sorts all edges and uses a Disjoint Set Union (Union-Find) data structure to greedily add edges, achieving O(E log E) time.
Prim's algorithm grows a tree from an arbitrary root node using a priority queue, operating in O((V + E) log V).`;

    await DocumentChunk.create([
      {
        material: studyNotes._id,
        course: dsaCourse._id,
        chunkIndex: 0,
        content: chunk1Content,
        tokenCount: chunk1Content.split(/\s+/).length,
        terms: tokenize(chunk1Content),
        metadata: { pageNumber: 1, sourceFileName: 'sample_dsa_graphs.pdf' }
      },
      {
        material: studyNotes._id,
        course: dsaCourse._id,
        chunkIndex: 1,
        content: chunk2Content,
        tokenCount: chunk2Content.split(/\s+/).length,
        terms: tokenize(chunk2Content),
        metadata: { pageNumber: 2, sourceFileName: 'sample_dsa_graphs.pdf' }
      },
      {
        material: studyNotes._id,
        course: dsaCourse._id,
        chunkIndex: 2,
        content: chunk3Content,
        tokenCount: chunk3Content.split(/\s+/).length,
        terms: tokenize(chunk3Content),
        metadata: { pageNumber: 3, sourceFileName: 'sample_dsa_graphs.pdf' }
      }
    ]);

    // 12. Job Postings for Career AI Matching
    console.log('[Seed] Creating Job Postings...');
    await JobPosting.create([
      {
        title: 'Full Stack Software Engineer (Entry Level)',
        company: 'CloudScale Technologies',
        location: 'Bengaluru, India / Hybrid',
        employmentType: 'Full-time',
        description: 'Seeking dynamic graduates with strong foundational knowledge in React, Node.js, Express, and MongoDB. You will develop customer-facing SaaS portals and scalable microservices.',
        requiredSkills: ['javascript', 'react', 'node.js', 'mongodb', 'git'],
        preferredSkills: ['typescript', 'docker', 'aws'],
        minCgpa: 7.5,
        salaryRange: '$65,000 - $80,000 / ₹12-16 LPA',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applyUrl: 'https://careers.google.com/jobs/results/?q=software%20engineer',
        postedBy: admin._id,
        active: true
      },
      {
        title: 'Associate Machine Learning Engineer',
        company: 'NeuralVision AI Labs',
        location: 'Remote',
        employmentType: 'Full-time',
        description: 'Join our research and product engineering team. You will train deep neural networks, optimize embeddings for vector databases, and integrate LLM RAG pipelines.',
        requiredSkills: ['python', 'machine learning', 'tensorflow', 'pytorch', 'sql'],
        preferredSkills: ['docker', 'fastapi', 'kubernetes'],
        minCgpa: 8.0,
        salaryRange: '$75,000 - $95,000 / ₹16-22 LPA',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        applyUrl: 'https://jobs.lever.co/neuralvision/ml-associate',
        postedBy: admin._id,
        active: true
      },
      {
        title: 'Graduate Software Engineer (Cloud & AI)',
        company: 'Microsoft Technology Center',
        location: 'Hyderabad, India / Hybrid',
        employmentType: 'Full-time',
        description: 'Collaborate with global teams building resilient cloud platforms and intelligent AI services on Azure. Strong foundations in data structures and systems required.',
        requiredSkills: ['c++', 'c#', 'python', 'algorithms', 'system design'],
        preferredSkills: ['azure', 'kubernetes', 'distributed systems'],
        minCgpa: 8.0,
        salaryRange: '$85,000 - $110,000 / ₹18-24 LPA',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        applyUrl: 'https://careers.microsoft.com/us/en/search-results?q=graduate%20software%20engineer',
        postedBy: admin._id,
        active: true
      }
    ]);

    // 13. Institutional Announcements
    console.log('[Seed] Creating Announcements...');
    await Announcement.create([
      {
        title: 'Mid-Semester Examinations Schedule Released',
        content: 'The official timetable for Spring Semester 2026 assessments is now live. Students must ensure minimum 75% attendance to receive examination hall permits.',
        author: admin._id,
        targetRole: 'all',
        priority: 'high',
        pinned: true
      },
      {
        title: 'Campus Hackathon 2026 Registrations Open',
        content: 'SmartCampus Annual Hackathon invites students from all engineering branches to showcase AI, robotics, and cloud computing projects.',
        author: drSharma._id,
        targetRole: 'student',
        priority: 'medium',
        pinned: false
      }
    ]);

    // 14. Notifications
    console.log('[Seed] Creating Notifications...');
    await Notification.create([
      {
        user: alex._id,
        title: 'Assignment Graded: POSIX Semaphores',
        message: 'Dr. Rajesh Sharma evaluated your submission: 48/50 Marks. Check the gradebook for detailed rubric feedback.',
        type: 'grade',
        link: '/student/assignments'
      },
      {
        user: alex._id,
        title: 'New Quiz Posted in CS301',
        message: 'Algorithms Mid-Term Mastery Quiz has been published and is ready for completion.',
        type: 'assignment',
        link: '/student/assessments'
      },
      {
        user: admin._id,
        title: 'Pending Faculty Approval Request',
        message: 'Prof. Anita Patel (Assistant Professor, Information Technology) registered and awaits verification.',
        type: 'system',
        link: '/admin/users'
      }
    ]);

    console.log(`\n================================================================`);
    console.log(`✅ SmartCampus AI Database Seeding Complete!`);
    console.log(`================================================================`);
    console.log(`Demo Credentials for Demonstration & Testing:`);
    console.log(`1. Administrator:`);
    console.log(`   Email:    admin@smartcampus.edu`);
    console.log(`   Password: Admin@12345`);
    console.log(`2. Faculty Member (Approved):`);
    console.log(`   Email:    dr.sharma@smartcampus.edu`);
    console.log(`   Password: Faculty@12345`);
    console.log(`3. Faculty Member (Pending Approval):`);
    console.log(`   Email:    prof.patel@smartcampus.edu`);
    console.log(`   Password: Faculty@12345`);
    console.log(`4. Student:`);
    console.log(`   Email:    alex.student@smartcampus.edu`);
    console.log(`   Password: Student@12345`);
    console.log(`================================================================\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}

seedDatabase();
