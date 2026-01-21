# Audix Solutions - Staff Management System

A complete staff attendance and payroll management system built with React + FastAPI + MongoDB.

## Features

- **User Management**: Admin, Team Lead, Employee roles
- **Attendance Tracking**: QR code scanning, manual marking, real-time updates
- **Payroll System**: 
  - Monthly salary employees (salary ÷ days in month)
  - Daily wage employees (fixed daily rate)
- **Leave Management**: Apply, approve, track leave balance
- **Bills & Advances**: Submission, approval, revalidation workflow
- **Audit Expenses**: Track and approve field expenses
- **Cashbook**: Cash in/out tracking
- **Reports & Exports**: CSV exports for all data

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

## Environment Variables

### Backend (.env)
```
MONGO_URL=your_mongodb_connection_string
DB_NAME=audix_staff_management
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=your_backend_url
```

## Default Login

```
ID: ADMIN001
Password: admin123
```

## Salary Types

| Type | Calculation |
|------|-------------|
| Monthly | salary ÷ days_in_month |
| Daily | Fixed daily rate |

## License

Private - Audix Solutions
