import React, { useState } from 'react';
import { cashbookEntries } from '../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../components/ui/select';
import { BookOpen, Plus, TrendingUp, TrendingDown, IndianRupee, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Cashbook = () => {
  const [entries, setEntries] = useState(cashbookEntries);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [newEntry, setNewEntry] = useState({
    type: 'in', category: '', description: '', amount: '', paymentMode: 'Cash'
  });

  const filteredEntries = entries.filter(e => filterType === 'all' || e.type === filterType);

  const totalIn = entries.filter(e => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
  const totalOut = entries.filter(e => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIn - totalOut;

  const handleAddEntry = () => {
    const entry = {
      id: `CB${Date.now()}`,
      type: newEntry.type,
      category: newEntry.category,
      description: newEntry.description,
      amount: parseInt(newEntry.amount),
      date: new Date().toISOString().split('T')[0],
      paymentMode: newEntry.paymentMode
    };
    setEntries([entry, ...entries]);
    setNewEntry({ type: 'in', category: '', description: '', amount: '', paymentMode: 'Cash' });
    setIsAddDialogOpen(false);
  };

  const categories = {
    in: ['Client Payment', 'Investment', 'Loan', 'Refund', 'Other Income'],
    out: ['Salary', 'Rent', 'Utilities', 'Office Supplies', 'Travel', 'Marketing', 'Other Expense']
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cashbook</h1>
          <p className="text-gray-500">Track cash flow</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
              <Plus size={18} className="mr-2" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Cashbook Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newEntry.type} onValueChange={(v) => setNewEntry({...newEntry, type: v, category: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Cash In</SelectItem>
                    <SelectItem value="out">Cash Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newEntry.category} onValueChange={(v) => setNewEntry({...newEntry, category: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[newEntry.type].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={newEntry.paymentMode} onValueChange={(v) => setNewEntry({...newEntry, paymentMode: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Entry description"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddEntry} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">
                Add Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Cash In</p>
                <p className="text-3xl font-bold">₹{totalIn.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowUpRight size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Cash Out</p>
                <p className="text-3xl font-bold">₹{totalOut.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowDownRight size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Balance</p>
                <p className="text-3xl font-bold">₹{balance.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <IndianRupee size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entries</SelectItem>
              <SelectItem value="in">Cash In</SelectItem>
              <SelectItem value="out">Cash Out</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Entries */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Date</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Type</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Category</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Description</th>
                  <th className="text-left p-4 font-semibold text-gray-600 text-sm">Mode</th>
                  <th className="text-right p-4 font-semibold text-gray-600 text-sm">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-700">{entry.date}</td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1 text-xs font-medium ${
                        entry.type === 'in' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {entry.type === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {entry.type === 'in' ? 'Cash In' : 'Cash Out'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm max-w-xs truncate">{entry.description}</td>
                    <td className="p-4 text-gray-600 text-sm">{entry.paymentMode}</td>
                    <td className={`p-4 text-right font-bold ${
                      entry.type === 'in' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {entry.type === 'in' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cashbook;
