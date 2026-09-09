'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Clock, Image, Save, Loader2, Eye, EyeOff, Bell, Palette, Lock, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSettings, updateSettings, changePassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import type { Settings } from '@/types';

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'notifications' | 'security'>('general');
  const [isSaving, setIsSaving] = useState(false);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const settings = settingsData?.data;
  const [form, setForm] = useState({
    cafe_name: settings?.cafe_name || 'One Folk Cafe',
    address: settings?.address || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    open_time: settings?.open_time || '08:00',
    close_time: settings?.close_time || '22:00',
    instagram_link: settings?.instagram_link || '',
    description: settings?.description || '',
  });

  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved!');
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to save settings');
      setIsSaving(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateMutation.mutate(form);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Building2 className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Image className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your cafe configuration</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Tab Navigation */}
          <div className="border-b border-border">
            <nav className="flex overflow-x-auto px-4" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/50'
                  )}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Panels */}
          <div className="p-6">
            {activeTab === 'general' && (
              <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Cafe Information
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cafe_name">Cafe Name *</Label>
                      <Input
                        id="cafe_name"
                        value={form.cafe_name}
                        onChange={e => setForm({ ...form, cafe_name: e.target.value })}
                        placeholder="One Folk Cafe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91-9876543210"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      rows={3}
                      placeholder="123 Main Street, City, State"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="info@onefolkcafe.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram_link">Instagram Link</Label>
                      <Input
                        id="instagram_link"
                        value={form.instagram_link}
                        onChange={e => setForm({ ...form, instagram_link: e.target.value })}
                        placeholder="https://instagram.com/onefolkcafe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      rows={4}
                      placeholder="Welcome to One Folk Cafe..."
                    />
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Operating Hours
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="open_time">Opening Time</Label>
                      <Input
                        id="open_time"
                        type="time"
                        value={form.open_time}
                        onChange={e => setForm({ ...form, open_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="close_time">Closing Time</Label>
                      <Input
                        id="close_time"
                        type="time"
                        value={form.close_time}
                        onChange={e => setForm({ ...form, close_time: e.target.value })}
                      />
                    </div>
                  </div>
                </motion.div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <Button type="submit" disabled={isSaving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Branding & Images
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                        <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload logo</p>
                        <Input type="file" accept="image/*" className="hidden" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Hero/Banner Image</Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                        <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload banner</p>
                        <Input type="file" accept="image/*" className="hidden" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Recommended: Logo 200x200px (PNG with transparency), Banner 1200x400px
                  </p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Color Theme
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    {['primary', 'secondary', 'accent'].map((theme) => (
                      <Button
                        key={theme}
                        variant="outline"
                        className="gap-2"
                        onClick={() => toast.info(`${theme} theme customization coming soon`)}
                      >
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(var(--${theme}))` }} />
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    {[
                      { id: 'new_orders', label: 'New Order Alerts', desc: 'Get notified when a new order is placed' },
                      { id: 'payment_received', label: 'Payment Received', desc: 'Notification when payment is completed' },
                      { id: 'low_stock', label: 'Low Stock Alerts', desc: 'Alert when product stock is running low' },
                      { id: 'daily_summary', label: 'Daily Summary', desc: 'Receive end-of-day sales summary' },
                    ].map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Change Password
                  </h3>
                  <ChangePasswordForm />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Session Management
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                      <div>
                        <p className="font-medium">Auto Logout</p>
                        <p className="text-sm text-muted-foreground">Automatically log out after inactivity</p>
                      </div>
                      <select defaultValue="60" className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                        <option value="480">8 hours</option>
                        <option value="0">Never</option>
                      </select>
                    </div>
                    <Button variant="outline" onClick={() => toast.info('Logout all sessions feature coming soon')}>
                      Logout All Other Sessions
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword, token || '');
      if (response.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Current Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>New Password</Label>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
      </div>
      <div className="space-y-2">
        <Label>Confirm New Password</Label>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
      </Button>
    </form>
  );
}