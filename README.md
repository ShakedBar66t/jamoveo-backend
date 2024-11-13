
# JaMoveo Backend

## Project Overview
This is the backend server for JaMoveo, a web app supporting Moveo band rehearsals by providing a controlled environment where users (musicians) can log in, join sessions, and view song details based on their role. The backend handles user authentication, session management, and song data distribution.

## Tech Stack
- **Backend**: Node.js with Express (TypeScript)
- **Database**: Firestore (used for user data storage and authentication)
- **Socket Implementation**: Real-time updates for user interactions

## Installation and Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Start the server using `npm run dev` (for development with nodemon) or `npm start`. The backend runs on `localhost:5001`.

## Checklist of Features Implemented
- [x] **User Registration** - Regular and admin registration with instrument specification
- [x] **Login Authentication** - Supports user and admin login via Firestore authentication
- [x] **Session Management** - Admin can initiate and terminate rehearsal sessions
- [x] **Socket Support** - Real-time updates for song selection and live page display

## Features Not Implemented
- [ ] External song data fetching via web crawling (Bonus feature)

## Usage Instructions
1. **Admin Setup**: Register as an admin at [Admin Signup URL](https://jamoveo-backend-q7fv.onrender.com/signup/admin), then log in to manage sessions.
2. **Regular User Setup**: Register as a user at [User Signup URL](https://jamoveo-backend-q7fv.onrender.com/signup), then log in to join the session and view song details per the instrument role.

## Deployment
The backend is deployed via Render at [https://jamoveo-backend-q7fv.onrender.com](https://jamoveo-backend-q7fv.onrender.com).

---
