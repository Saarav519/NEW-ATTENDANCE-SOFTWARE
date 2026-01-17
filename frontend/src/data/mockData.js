// Mock Data for SuperManage App

// Business Info
export const businessInfo = {
  id: "1",
  name: "Audix Solutions & Co.",
  type: "Information Technology",
  email: "admin@audixsolutions.com",
  phone: "+91 98765 43210",
  address: "Bangalore, India",
  logo: null
};

// Users/Employees
export const employees = [
  {
    id: "EMP001",
    name: "Rahul Kumar",
    email: "rahul@wesoftek.com",
    phone: "+91 98765 43211",
    role: "employee",
    department: "Development",
    designation: "Software Engineer",
    joiningDate: "2023-01-15",
    salary: 50000,
    salaryType: "monthly",
    status: "active",
    avatar: null
  },
  {
    id: "EMP002",
    name: "Priya Singh",
    email: "priya@wesoftek.com",
    phone: "+91 98765 43212",
    role: "employee",
    department: "Design",
    designation: "UI/UX Designer",
    joiningDate: "2023-03-20",
    salary: 45000,
    salaryType: "monthly",
    status: "active",
    avatar: null
  },
  {
    id: "EMP003",
    name: "Amit Sharma",
    email: "amit@wesoftek.com",
    phone: "+91 98765 43213",
    role: "employee",
    department: "Development",
    designation: "Senior Developer",
    joiningDate: "2022-06-10",
    salary: 75000,
    salaryType: "monthly",
    status: "active",
    avatar: null
  },
  {
    id: "EMP004",
    name: "Sneha Patel",
    email: "sneha@wesoftek.com",
    phone: "+91 98765 43214",
    role: "employee",
    department: "HR",
    designation: "HR Manager",
    joiningDate: "2022-01-05",
    salary: 55000,
    salaryType: "monthly",
    status: "active",
    avatar: null
  },
  {
    id: "EMP005",
    name: "Vikram Reddy",
    email: "vikram@wesoftek.com",
    phone: "+91 98765 43215",
    role: "employee",
    department: "Marketing",
    designation: "Marketing Executive",
    joiningDate: "2023-07-01",
    salary: 40000,
    salaryType: "monthly",
    status: "inactive",
    avatar: null
  }
];

// Admin user
export const adminUser = {
  id: "ADMIN001",
  name: "Admin User",
  email: "admin@wesoftek.com",
  role: "admin",
  password: "admin123"
};

// Attendance Records
export const attendanceRecords = [
  { id: "ATT001", empId: "EMP001", date: "2025-07-14", punchIn: "09:05", punchOut: "18:30", status: "present", workHours: 9.42 },
  { id: "ATT002", empId: "EMP002", date: "2025-07-14", punchIn: "09:15", punchOut: "18:00", status: "present", workHours: 8.75 },
  { id: "ATT003", empId: "EMP003", date: "2025-07-14", punchIn: "08:45", punchOut: "19:00", status: "present", workHours: 10.25 },
  { id: "ATT004", empId: "EMP004", date: "2025-07-14", punchIn: null, punchOut: null, status: "leave", workHours: 0 },
  { id: "ATT005", empId: "EMP001", date: "2025-07-13", punchIn: "09:00", punchOut: "18:00", status: "present", workHours: 9 },
  { id: "ATT006", empId: "EMP002", date: "2025-07-13", punchIn: "09:30", punchOut: "17:30", status: "present", workHours: 8 },
  { id: "ATT007", empId: "EMP003", date: "2025-07-13", punchIn: null, punchOut: null, status: "absent", workHours: 0 },
];

// Leave Requests
export const leaveRequests = [
  { id: "LV001", empId: "EMP001", empName: "Rahul Kumar", type: "Sick Leave", fromDate: "2025-07-20", toDate: "2025-07-21", days: 2, reason: "Fever and cold", status: "pending", appliedOn: "2025-07-14" },
  { id: "LV002", empId: "EMP002", empName: "Priya Singh", type: "Casual Leave", fromDate: "2025-07-18", toDate: "2025-07-18", days: 1, reason: "Personal work", status: "approved", appliedOn: "2025-07-12" },
  { id: "LV003", empId: "EMP004", empName: "Sneha Patel", type: "Vacation", fromDate: "2025-07-25", toDate: "2025-07-30", days: 6, reason: "Family trip", status: "pending", appliedOn: "2025-07-10" },
];

// Overtime Records
export const overtimeRecords = [
  { id: "OT001", empId: "EMP001", empName: "Rahul Kumar", date: "2025-07-12", hours: 3, rate: 250, amount: 750, reason: "Project deadline", status: "approved" },
  { id: "OT002", empId: "EMP003", empName: "Amit Sharma", date: "2025-07-13", hours: 2, rate: 350, amount: 700, reason: "Client call", status: "approved" },
  { id: "OT003", empId: "EMP002", empName: "Priya Singh", date: "2025-07-14", hours: 1.5, rate: 200, amount: 300, reason: "Design review", status: "pending" },
];

// Advances
export const advances = [
  { id: "ADV001", empId: "EMP001", empName: "Rahul Kumar", amount: 10000, date: "2025-07-01", reason: "Medical emergency", status: "approved", deductFrom: "July 2025" },
  { id: "ADV002", empId: "EMP003", empName: "Amit Sharma", amount: 15000, date: "2025-07-05", reason: "House rent", status: "approved", deductFrom: "July 2025" },
  { id: "ADV003", empId: "EMP002", empName: "Priya Singh", amount: 5000, date: "2025-07-10", reason: "Personal", status: "pending", deductFrom: "August 2025" },
];

// Payroll
export const payrollRecords = [
  { id: "PAY001", empId: "EMP001", empName: "Rahul Kumar", month: "June 2025", basicSalary: 50000, overtime: 1500, bonus: 0, deductions: 5000, advance: 0, netSalary: 46500, status: "paid", paidOn: "2025-07-01" },
  { id: "PAY002", empId: "EMP002", empName: "Priya Singh", month: "June 2025", basicSalary: 45000, overtime: 600, bonus: 2000, deductions: 4500, advance: 0, netSalary: 43100, status: "paid", paidOn: "2025-07-01" },
  { id: "PAY003", empId: "EMP003", empName: "Amit Sharma", month: "June 2025", basicSalary: 75000, overtime: 2100, bonus: 0, deductions: 7500, advance: 10000, netSalary: 59600, status: "paid", paidOn: "2025-07-01" },
];

// Cashbook Entries
export const cashbookEntries = [
  { id: "CB001", type: "in", category: "Client Payment", description: "Project Alpha payment", amount: 150000, date: "2025-07-01", paymentMode: "Bank Transfer" },
  { id: "CB002", type: "out", category: "Salary", description: "June salaries", amount: 225000, date: "2025-07-01", paymentMode: "Bank Transfer" },
  { id: "CB003", type: "out", category: "Rent", description: "Office rent July", amount: 50000, date: "2025-07-05", paymentMode: "Bank Transfer" },
  { id: "CB004", type: "in", category: "Client Payment", description: "Project Beta milestone", amount: 75000, date: "2025-07-10", paymentMode: "Cheque" },
  { id: "CB005", type: "out", category: "Utilities", description: "Electricity bill", amount: 15000, date: "2025-07-12", paymentMode: "Cash" },
  { id: "CB006", type: "out", category: "Office Supplies", description: "Stationery and supplies", amount: 5000, date: "2025-07-14", paymentMode: "Cash" },
];

// Vehicles
export const vehicles = [
  { id: "VH001", name: "Mahindra XUV 500", registrationNo: "KA01AB1234", type: "SUV", fuelType: "Diesel", assignedTo: "Company" },
  { id: "VH002", name: "Honda City", registrationNo: "KA01CD5678", type: "Sedan", fuelType: "Petrol", assignedTo: "Amit Sharma" },
];

// Vehicle Expenses
export const vehicleExpenses = [
  { id: "VE001", vehicleId: "VH001", vehicleName: "Mahindra XUV 500", type: "Fuel", amount: 5000, date: "2025-07-10", description: "Full tank", odometer: 45230 },
  { id: "VE002", vehicleId: "VH001", vehicleName: "Mahindra XUV 500", type: "Service", amount: 8500, date: "2025-07-05", description: "Regular service", odometer: 45000 },
  { id: "VE003", vehicleId: "VH002", vehicleName: "Honda City", type: "Fuel", amount: 3000, date: "2025-07-12", description: "Fuel refill", odometer: 32100 },
  { id: "VE004", vehicleId: "VH002", vehicleName: "Honda City", type: "Insurance", amount: 15000, date: "2025-07-01", description: "Annual insurance renewal", odometer: 32000 },
];

// Business Holidays
export const holidays = [
  { id: "HOL001", name: "New Year", date: "2025-01-01", type: "National" },
  { id: "HOL002", name: "Republic Day", date: "2025-01-26", type: "National" },
  { id: "HOL003", name: "Holi", date: "2025-03-14", type: "Festival" },
  { id: "HOL004", name: "Independence Day", date: "2025-08-15", type: "National" },
  { id: "HOL005", name: "Diwali", date: "2025-10-20", type: "Festival" },
  { id: "HOL006", name: "Christmas", date: "2025-12-25", type: "Festival" },
];

// Dashboard Stats
export const dashboardStats = {
  totalEmployees: 5,
  activeEmployees: 4,
  presentToday: 3,
  absentToday: 1,
  onLeaveToday: 1,
  pendingLeaves: 2,
  pendingOvertime: 1,
  totalAdvancesPending: 5000,
  cashBalance: 30000,
  thisMonthExpenses: 295000,
  thisMonthIncome: 225000
};

// Sidebar Navigation
export const sidebarNavItems = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard" },
  { id: "employees", label: "Employees", icon: "Users", path: "/employees" },
  { id: "attendance", label: "Attendance", icon: "CalendarCheck", path: "/attendance" },
  { id: "leaves", label: "Leaves", icon: "CalendarOff", path: "/leaves" },
  { id: "overtime", label: "Overtime", icon: "Clock", path: "/overtime" },
  { id: "advances", label: "Advances", icon: "Wallet", path: "/advances" },
  { id: "payroll", label: "Payroll", icon: "Banknote", path: "/payroll" },
  { id: "cashbook", label: "Cashbook", icon: "BookOpen", path: "/cashbook" },
  { id: "vehicles", label: "Vehicles", icon: "Car", path: "/vehicles" },
  { id: "holidays", label: "Holidays", icon: "Gift", path: "/holidays" },
  { id: "reports", label: "Reports", icon: "BarChart3", path: "/reports" },
];
