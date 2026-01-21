import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { shiftTemplateAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { Sun, Moon, Plus, Edit2, Trash2, Clock, IndianRupee, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ShiftTemplates = () => {
  const { user, isAdmin } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    shift_type: 'day',
    shift_start: '10:00',
    shift_end: '19:00',
    grace_period_minutes: 30,
    half_day_cutoff_hours: 3,
    default_conveyance: 200
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await shiftTemplateAPI.getAll(false);
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load shift templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Please enter a template name');
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingTemplate) {
        await shiftTemplateAPI.update(editingTemplate.id, formData);
        toast.success('Template updated successfully!');
      } else {
        await shiftTemplateAPI.create(formData, user.id);
        toast.success('Template created successfully!');
      }
      setShowDialog(false);
      resetForm();
      await loadTemplates();
    } catch (error) {
      toast.error(error.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      shift_type: template.shift_type,
      shift_start: template.shift_start,
      shift_end: template.shift_end,
      grace_period_minutes: template.grace_period_minutes,
      half_day_cutoff_hours: template.half_day_cutoff_hours,
      default_conveyance: template.default_conveyance
    });
    setShowDialog(true);
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await shiftTemplateAPI.delete(templateId);
      toast.success('Template deleted successfully!');
      await loadTemplates();
    } catch (error) {
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      shift_type: 'day',
      shift_start: '10:00',
      shift_end: '19:00',
      grace_period_minutes: 30,
      half_day_cutoff_hours: 3,
      default_conveyance: 200
    });
  };

  const formatTime = (time24) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Only admins can manage shift templates</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shift Templates</h1>
          <p className="text-gray-500">Manage configurable shift schedules</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowDialog(true); }}
          className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
        >
          <Plus size={18} className="mr-2" /> Add Template
        </Button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1E2A5E]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className={`${!template.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      template.shift_type === 'day' ? 'bg-yellow-100' : 'bg-indigo-100'
                    }`}>
                      {template.shift_type === 'day' ? 
                        <Sun size={24} className="text-yellow-600" /> : 
                        <Moon size={24} className="text-indigo-600" />
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{template.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{template.shift_type} Shift</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Clock size={14} /> Timing
                    </span>
                    <span className="font-medium">
                      {formatTime(template.shift_start)} - {formatTime(template.shift_end)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Grace Period</span>
                    <span className="font-medium">{template.grace_period_minutes} min</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Half-day Cutoff</span>
                    <span className="font-medium">{template.half_day_cutoff_hours} hours</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="flex items-center gap-2 text-green-700">
                      <IndianRupee size={14} /> Conveyance
                    </span>
                    <span className="font-medium text-green-700">₹{template.default_conveyance}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {templates.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No shift templates found. Create one to get started.
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Shift Template' : 'Create Shift Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g., Morning Shift"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <Select value={formData.shift_type} onValueChange={(v) => setFormData({...formData, shift_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">
                    <div className="flex items-center gap-2">
                      <Sun size={16} className="text-yellow-500" /> Day Shift
                    </div>
                  </SelectItem>
                  <SelectItem value="night">
                    <div className="flex items-center gap-2">
                      <Moon size={16} className="text-indigo-500" /> Night Shift
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.shift_start}
                  onChange={(e) => setFormData({...formData, shift_start: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.shift_end}
                  onChange={(e) => setFormData({...formData, shift_end: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Grace Period (min)</Label>
                <Input
                  type="number"
                  value={formData.grace_period_minutes}
                  onChange={(e) => setFormData({...formData, grace_period_minutes: parseInt(e.target.value) || 30})}
                />
              </div>
              <div className="space-y-2">
                <Label>Half-day Cutoff (hours)</Label>
                <Input
                  type="number"
                  value={formData.half_day_cutoff_hours}
                  onChange={(e) => setFormData({...formData, half_day_cutoff_hours: parseInt(e.target.value) || 3})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Default Conveyance (₹)</Label>
              <Input
                type="number"
                value={formData.default_conveyance}
                onChange={(e) => setFormData({...formData, default_conveyance: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftTemplates;
