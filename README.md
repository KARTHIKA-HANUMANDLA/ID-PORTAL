# Smart Digital ID Verification System

A modern campus identity management platform that replaces traditional physical ID cards with secure digital IDs using QR-based authentication and integrated library management.

---

# Project Overview

The **Smart Digital ID Verification System** is designed to improve campus security, simplify identity verification, and automate library management.

This system enables students, faculty, staff, security personnel, and librarians to access role-based dashboards and services through a unified platform.

The project uses **dynamic QR codes**, **JWT authentication**, and **MongoDB** to provide secure and efficient digital identity verification.

---

# Features

## Authentication & Security

* JWT-based secure login system
* Role-based access control
* Dynamic QR code generation
* Time-limited QR verification
* Monthly scan limit enforcement
* Entry and exit logging

## Digital ID System

* Digital ID cards for students and staff
* Accessible from any device
* Instant QR verification

## Library Integration

* Issued book tracking
* Return deadline monitoring
* Automated overdue alerts
* Librarian management dashboard

## Dashboards

* Admin Dashboard
* Student Dashboard
* Faculty Dashboard
* Security Dashboard
* Librarian Dashboard
* Non-Teaching Staff Dashboard

---

# Technology Stack

## Frontend

* React.js
* HTML5
* CSS3
* JavaScript

## Backend

* Node.js
* Express.js

## Database

* MongoDB

## Authentication

* JWT (JSON Web Token)

## QR System

* QR Code Generator & Scanner

---

# System Architecture

```text
Frontend (React.js)
        ↓
Backend API (Node.js + Express)
        ↓
Authentication (JWT)
        ↓
MongoDB Database
        ↓
QR Verification & Library Modules
```

---

# User Roles

| Role               | Responsibilities                        |
| ------------------ | --------------------------------------- |
| Admin              | Manage users, logs, and system settings |
| Student            | Access digital ID and library status    |
| Faculty            | View access logs and library activity   |
| Security           | Scan QR codes and monitor entry logs    |
| Librarian          | Manage books and overdue alerts         |
| Non-Teaching Staff | Access dedicated staff services         |

---

# QR Verification Workflow

1. User logs into the system
2. Dynamic QR code is generated
3. Security personnel scan the QR code
4. Backend validates the QR
5. Access is granted or denied
6. Entry is logged in the database

---

# Project Structure

```text
smart-digital-id-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   ├── middleware/
│   └── server.js
│
├── database/
│
├── README.md
└── package.json
```

---

# Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/smart-digital-id-system.git
```

---

## 2. Navigate to Project Directory

```bash
cd smart-digital-id-system
```

---

## 3. Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## 4. Install Backend Dependencies

```bash
cd ../backend
npm install
```

---

## 5. Configure Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

---

## 6. Run Backend Server

```bash
npm start
```

---

## 7. Run Frontend

```bash
cd frontend
npm start
```

---

# Future Enhancements

* Face Recognition Authentication
* Native Mobile Application
* Geo-location Based Verification
* Real-time Notifications
* Cloud Deployment

---
