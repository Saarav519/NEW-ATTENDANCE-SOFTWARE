import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { holidayAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Gift, Plus, Calendar, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Holidays = () => {
  const { isAdmin } = useAuth();
  const [holidayList, setHolidayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '', date: '', type: 'Festival'
  });

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const data = await holidayAPI.getAll();
      setHolidayList(data || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const upcomingHolidays = holidayList
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const pastHolidays = holidayList
    .filter(h => new Date(h.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await holidayAPI.create(newHoliday);
      toast.success('Holiday added successfully!');
      setNewHoliday({ name: '', date: '', type: 'Festival' });
      setIsAddDialogOpen(false);
      await loadHolidays();
    } catch (error) {
      toast.error(error.message || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
      await holidayAPI.delete(id);
      toast.success('Holiday deleted successfully!');
      await loadHolidays();
    } catch (error) {
      toast.error(error.message || 'Failed to delete holiday');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'National': return 'bg-blue-100 text-blue-700';
      case 'Festival': return 'bg-orange-100 text-orange-700';
      case 'Company': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E2A5E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Business Holidays</h1>
          <p className="text-gray-500">{isAdmin ? 'Manage company holidays' : 'View company holidays'}</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                <Plus size={18} className="mr-2" /> Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Holiday</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Holiday Name</Label>
                  <Input
                    placeholder="e.g., Diwali"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newHoliday.type} onValueChange={(v) => setNewHoliday({...newHoliday, type: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="National">National Holiday</SelectItem>
                      <SelectItem value="Festival">Festival</SelectItem>
                      <SelectItem value="Company">Company Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleAddHoliday} 
                  className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Holiday
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Gift size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{holidayList.length}</p>
              <p className="text-sm text-gray-500">Total Holidays</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{upcomingHolidays.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{pastHolidays.length}</p>
              <p className="text-sm text-gray-500">Past</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Holidays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift size={20} className="text-purple-600" />
            Upcoming Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingHolidays.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming holidays</p>
          ) : (
            <div className="space-y-3">
              {upcomingHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                      <span className="text-xs text-gray-500">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-lg font-bold text-gray-800">{new Date(holiday.date).getDate()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{holiday.name}</h3>
                      <p className="text-sm text-gray-500">{formatDate(holiday.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(holiday.type)}`}>
                      {holiday.type}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(holiday.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Holidays */}
      {pastHolidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-500">Past Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastHolidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">{holiday.name}</span>
                    <span className="text-xs text-gray-400">{formatDate(holiday.date)}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeColor(holiday.type)}`}>
                    {holiday.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Holidays;
