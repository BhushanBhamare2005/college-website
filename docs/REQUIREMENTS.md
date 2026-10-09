# Phase 1 – Requirements Extracted from the Project Report

Source: `College_Department_Website_Report_FIXED.pdf` (20 pages).
Institution: Matoshri Education Society's Matoshri College of Engineering and Research Centre, Nashik.
Department: Electronics and Computer Engineering (T.Y. B.Tech.), Academic Year 2026–2027.

## Verified project facts (safe to show on the site)
| Item | Value (from report) |
|---|---|
| Project title (certificate, declaration, abstract) | College Department Website |
| Team | Sagar Hukumdar, Sohan Kharate, Yash Khanderay, Arvind Chavan, Achal Kalamkar |
| Project guide | Ms. Harshali Ahire |
| Head of Department | Dr J.J Chopda |
| Society / College | Matoshri Education Society / Matoshri College of Engineering and Research Centre, Eklahare, Nashik |
| Motto on logo | Knowledge · Perspective · Understanding |
| Year of establishment | 2008 (from the college photo signage) |

Everything else (phone, e-mail, address lines, other faculty, labs, events, notices) is **not** in the report and is shown as clearly marked placeholder/demo data.

## Report discrepancy to fix
The report **cover page** reads "Online Library Management System using Java Servlet and MySQL", while the certificate, declaration, abstract and every chapter describe a **College Department Website**. The cover page title looks like a leftover from another project. Please correct it before submission.

## Objectives (1.3)
Develop a College Department Website; provide department information digitally; easy access to faculty information; course and laboratory information; notices and announcements; events and achievements; reduce manual sharing and save time; keep information organised.

## Functional requirements (4.6, 1.4, 6.2, 9.1)
- Display, add, update and manage department information.
- Faculty and staff information (name, designation, qualification, specialization, email, experience).
- Course and laboratory information.
- Notices, events (seminars, workshops, technical events, programs, sorted by date) and achievements.
- Contact information / contact the department.
- Search information by keyword (5.3).
- Add faculty (5.2), add notice and event (5.4): enter → validate → store → success message.
- Actors: Student, Faculty, Visitor, Administrator. Use cases: view department info, faculty, courses, laboratories, notices, events, achievements, contact department, manage information.

## Non-functional requirements (4.7)
Simple UI, accurate information, fast response, reliable storage, easy maintenance, input validation.

## Data model in report (4.2)
- Faculty: Faculty_ID, Name, Qualification, Designation, Email
- Course: Course_ID, Course_Name, Duration, Description
- Notice: Notice_ID, Title, Description, Date
(The class diagram also lists User, Laboratory, Event, Achievement, Contact, Database.)

## Report's own future scope (7.3) – we implement as enhancements
Student and faculty login, role-based administrator login, online feedback/forms. Not implemented: e-mail/SMS notifications, cloud DB integration, mobile app (listed as future work).

## Stack note
The report names HTML, CSS, JavaScript, a database and a web server without mandating products. React + Vite (HTML/CSS/JS), Express (web server) and MongoDB (database) from the master prompt fit that description, so no conflict. Layered flow follows 4.1: User → Web Interface → Web Logic → Database → Response.

## Beyond the report
Laboratories and Achievements are in the report but absent from the master prompt's page list; they are added as first-class pages/modules.
