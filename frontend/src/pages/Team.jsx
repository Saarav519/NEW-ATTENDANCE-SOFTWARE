import React from 'react';
import { useAuth } from '../context/AuthContext';
import { users, attendanceRecords } from '../data/mockData';
import { Card, CardContent } from '../components/ui/card';
import { Users, UserCheck, UserX, Phone, Mail, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Team = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get team members
  const teamMembers = users.filter(u => user.teamMembers?.includes(u.id));
  const presentCount = teamMembers.length - 1; // Mock
  const absentCount = 1; // Mock

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800">My Team</h1>
        <p className="text-sm text-gray-500">{user.department} Department</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-800">{teamMembers.length}</p>
            <p className="text-[10px] text-gray-500">Total Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-600">{presentCount}</p>
            <p className="text-[10px] text-gray-500">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-red-100 rounded-xl flex items-center justify-center">
              <UserX size={20} className="text-red-600" />
            </div>
            <p className="text-xl font-bold text-red-600">{absentCount}</p>
            <p className="text-[10px] text-gray-500">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Team Members</h3>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.designation}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    Present
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 pl-15">
                  <a href={`tel:${member.phone}`} className="flex items-center gap-1 hover:text-[#1E2A5E]">
                    <Phone size={12} /> {member.phone}
                  </a>
                  <a href={`mailto:${member.email}`} className="flex items-center gap-1 hover:text-[#1E2A5E]">
                    <Mail size={12} /> Email
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/team-attendance')}
              className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <span className="font-medium text-blue-700">View Team Attendance</span>
              <ChevronRight size={18} className="text-blue-500" />
            </button>
            <button
              onClick={() => navigate('/leaves')}
              className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <span className="font-medium text-orange-700">Manage Leave Requests</span>
              <ChevronRight size={18} className="text-orange-500" />
            </button>
            <button
              onClick={() => navigate('/overtime')}
              className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <span className="font-medium text-purple-700">Review Overtime</span>
              <ChevronRight size={18} className="text-purple-500" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
