import React, { useState } from 'react';
import { vehicles, vehicleExpenses } from '../data/mockData';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Car, Plus, Fuel, Wrench, Shield, IndianRupee } from 'lucide-react';

const Vehicles = () => {
  const [vehicleList, setVehicleList] = useState(vehicles);
  const [expenses, setExpenses] = useState(vehicleExpenses);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: '', registrationNo: '', type: 'SUV', fuelType: 'Petrol', assignedTo: 'Company'
  });
  const [newExpense, setNewExpense] = useState({
    vehicleId: '', type: 'Fuel', amount: '', description: '', odometer: ''
  });

  const totalFuelExpense = expenses.filter(e => e.type === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
  const totalServiceExpense = expenses.filter(e => e.type === 'Service').reduce((sum, e) => sum + e.amount, 0);
  const totalOtherExpense = expenses.filter(e => !['Fuel', 'Service'].includes(e.type)).reduce((sum, e) => sum + e.amount, 0);

  const handleAddVehicle = () => {
    const vehicle = {
      id: `VH${Date.now()}`,
      ...newVehicle
    };
    setVehicleList([...vehicleList, vehicle]);
    setNewVehicle({ name: '', registrationNo: '', type: 'SUV', fuelType: 'Petrol', assignedTo: 'Company' });
    setIsAddVehicleOpen(false);
  };

  const handleAddExpense = () => {
    const vehicle = vehicleList.find(v => v.id === newExpense.vehicleId);
    const expense = {
      id: `VE${Date.now()}`,
      vehicleId: newExpense.vehicleId,
      vehicleName: vehicle?.name || '',
      type: newExpense.type,
      amount: parseInt(newExpense.amount),
      date: new Date().toISOString().split('T')[0],
      description: newExpense.description,
      odometer: parseInt(newExpense.odometer)
    };
    setExpenses([expense, ...expenses]);
    setNewExpense({ vehicleId: '', type: 'Fuel', amount: '', description: '', odometer: '' });
    setIsAddExpenseOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicle Management</h1>
          <p className="text-gray-500">Track vehicles and expenses</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus size={18} className="mr-2" /> Add Vehicle</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Vehicle Name</Label>
                  <Input placeholder="e.g., Mahindra XUV 500" value={newVehicle.name} onChange={(e) => setNewVehicle({...newVehicle, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Registration No</Label>
                  <Input placeholder="e.g., KA01AB1234" value={newVehicle.registrationNo} onChange={(e) => setNewVehicle({...newVehicle, registrationNo: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newVehicle.type} onValueChange={(v) => setNewVehicle({...newVehicle, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['SUV', 'Sedan', 'Hatchback', 'Truck', 'Bike', 'Van'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fuel Type</Label>
                    <Select value={newVehicle.fuelType} onValueChange={(v) => setNewVehicle({...newVehicle, fuelType: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <Input placeholder="e.g., Company or Employee name" value={newVehicle.assignedTo} onChange={(e) => setNewVehicle({...newVehicle, assignedTo: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddVehicle} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">Add Vehicle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1E2A5E] hover:bg-[#2D3A8C]"><Plus size={18} className="mr-2" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Vehicle Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={newExpense.vehicleId} onValueChange={(v) => setNewExpense({...newExpense, vehicleId: v})}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {vehicleList.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.registrationNo})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expense Type</Label>
                    <Select value={newExpense.type} onValueChange={(v) => setNewExpense({...newExpense, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Fuel', 'Service', 'Insurance', 'Repair', 'Parking', 'Toll', 'Other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Odometer Reading (km)</Label>
                  <Input type="number" placeholder="Current odometer" value={newExpense.odometer} onChange={(e) => setNewExpense({...newExpense, odometer: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Expense description" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddExpense} className="bg-[#1E2A5E] hover:bg-[#2D3A8C]">Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Car size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{vehicleList.length}</p>
              <p className="text-sm text-gray-500">Vehicles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Fuel size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalFuelExpense.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Fuel</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wrench size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalServiceExpense.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Service</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">₹{totalOtherExpense.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Other</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vehicles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Vehicle</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Registration</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Type</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Fuel</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vehicleList.map((vehicle) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Car size={20} className="text-blue-600" />
                            </div>
                            <span className="font-medium">{vehicle.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700 font-mono">{vehicle.registrationNo}</td>
                        <td className="p-4 text-gray-700">{vehicle.type}</td>
                        <td className="p-4"><span className="text-xs px-2 py-1 bg-gray-100 rounded">{vehicle.fuelType}</span></td>
                        <td className="p-4 text-gray-700">{vehicle.assignedTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Date</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Vehicle</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Type</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Description</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Odometer</th>
                      <th className="text-right p-4 font-semibold text-gray-600 text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-700">{expense.date}</td>
                        <td className="p-4 font-medium">{expense.vehicleName}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            expense.type === 'Fuel' ? 'bg-orange-100 text-orange-700' :
                            expense.type === 'Service' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{expense.type}</span>
                        </td>
                        <td className="p-4 text-gray-600 text-sm">{expense.description}</td>
                        <td className="p-4 text-gray-700">{expense.odometer?.toLocaleString()} km</td>
                        <td className="p-4 text-right font-bold text-gray-800">₹{expense.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Vehicles;
