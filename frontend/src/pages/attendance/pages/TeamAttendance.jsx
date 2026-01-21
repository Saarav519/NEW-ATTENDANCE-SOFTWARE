import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { users, attendanceRecords } from '../data/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Calendar, UserCheck, UserX, CalendarOff, ChevronLeft, ChevronRight
} from 'lucide-react';

const TeamAttendance = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Get team members
  const teamMembers = users.filter(u => user.teamMembers?.includes(u.id));

  const todayStr = new Date().toISOString().split('T')[0];

  // Mock attendance status
  const getStatus = (empId) => {
    const statuses = ['present', 'present', 'absent', 'leave'];
    return statuses[Math.floor(Math.random() * 4)] || 'present';
  };

  const changeDate = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const presentCount = teamMembers.filter(() => Math.random() > 0.3).length;
  const absentCount = teamMembers.length - presentCount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Team Attendance</h1>
        <p className="text-sm text-gray-500">Mark and track team attendance</p>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {selectedDate === todayStr ? 'Today' : ''}
              </p>
              <p className="font-semibold">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <UserCheck size={20} className="mx-auto text-green-600 mb-1" />
            <p className="text-lg font-bold text-green-600">{presentCount}</p>
            <p className="text-[10px] text-gray-500">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <UserX size={20} className="mx-auto text-red-600 mb-1" />
            <p className="text-lg font-bold text-red-600">{absentCount}</p>
            <p className="text-[10px] text-gray-500">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CalendarOff size={20} className="mx-auto text-orange-600 mb-1" />
            <p className="text-lg font-bold text-orange-600">0</p>
            <p className="text-[10px] text-gray-500">Leave</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Team Members</h3>
          <div className="space-y-3">
            {teamMembers.map((member, idx) => {
              const status = idx === 0 ? 'present' : (idx === 1 ? 'present' : 'absent');
              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.designation}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className={`p-2 rounded-lg transition-colors ${status === 'present' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                      <UserCheck size={16} />
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                      <UserX size={16} />
                    </button>
                    <button className={`p-2 rounded-lg transition-colors ${status === 'leave' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}>
                      <CalendarOff size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamAttendance;
