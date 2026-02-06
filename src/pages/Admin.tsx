import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc, addDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Search, Users, Calendar, LogOut, Mail, CheckCircle, UserPlus, Edit, Upload, Trash2, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import { importCSVToFirebase } from '@/lib/csvImporter';

interface TeamMember {
  name: string;
  college: string;
  collegeType: string;
  customCollege: string;
  degreeType: string;
  customDegree: string;
  degree: string;
  yearOfStudy: string;
  branch: string;
  branchType: string;
  customBranch: string;
  rollNumber: string;
  email: string;
  phoneNumber: string;
  tshirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  isEmergencyContact?: boolean;
}

interface Movement {
  type: 'resting' | 'canteen' | 'other';
  timestamp: string;
  notes?: string;
}

interface FoodTracking {
  lunch6th: boolean;
  dinner6th: boolean;
  breakfast7th: boolean;
  lunch7th: boolean;
}

interface Registration {
  id: string;
  eventType: 'hackathon' | 'ctf';
  teamSize: number;
  teamName: string;
  teamMembers: TeamMember[];
  price: number;
  transactionId: string;
  paymentScreenshot: string;
  paymentScreenshotName: string;
  timestamp: string;
  confirmationSent?: boolean;
  confirmedAt?: string;
  isValid?: boolean;
  rejectedAt?: string;
  // Event Management Fields
  checkedIn?: boolean;
  checkedInAt?: string;
  initialVenue?: 'venue1' | 'venue2' | 'venue3';
  initialVenueAttendance?: boolean;
  finalLab?: 'ctf-lab' | 'hack-lab1' | 'hack-lab2' | 'hack-lab3' | 'hack-lab4' | 'hack-lab5' | 'hack-lab6' | 'hack-lab7' | 'hack-lab8' | 'hack-lab9';
  labAttendance?: boolean;
  foodTracking?: FoodTracking;
  movements?: Movement[];
  remarks?: string;
  // Kit Distribution
  welcomeKitReceived?: boolean;
  tshirtsDistributed?: boolean;
  idCardDistributed?: boolean;
  kitDistributedAt?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'hackathon' | 'ctf'>('all');
  const [duplicateFilter, setDuplicateFilter] = useState<'all' | 'duplicates' | 'unique'>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [editingTeam, setEditingTeam] = useState<Registration | null>(null);
  const [editingPayment, setEditingPayment] = useState<Registration | null>(null);
  const [newTransactionId, setNewTransactionId] = useState('');
  const [newPaymentScreenshot, setNewPaymentScreenshot] = useState<File | null>(null);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [importingCSV, setImportingCSV] = useState(false);
  const [editingMember, setEditingMember] = useState<{ regId: string; memberIndex: number; member: TeamMember } | null>(null);
  const [addingMember, setAddingMember] = useState<{ regId: string; newMember: Partial<TeamMember> } | null>(null);
  const [editingTeamDetails, setEditingTeamDetails] = useState<{ regId: string; teamName: string; eventType: 'hackathon' | 'ctf' } | null>(null);
  const [importingJSON, setImportingJSON] = useState(false);
  const [activeTab, setActiveTab] = useState<'registrations' | 'event-management'>('registrations');
  const [eventManagementSearch, setEventManagementSearch] = useState('');
  const [venueAssignmentMode, setVenueAssignmentMode] = useState(false);
  const [venue1Count, setVenue1Count] = useState(0);
  const [venue2Count, setVenue2Count] = useState(0);
  const [venue3Count, setVenue3Count] = useState(0);
  const [labAssignmentMode, setLabAssignmentMode] = useState(false);
  const [labCounts, setLabCounts] = useState<{ [key: string]: number }>({});
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Check authentication on mount
  useEffect(() => {
    const authToken = sessionStorage.getItem('admin_auth');
    if (!authToken) {
      navigate('/regdata');
    }
    
    // Check if there's a saved last refresh time
    const savedLastRefresh = localStorage.getItem('lastRefreshTime');
    if (savedLastRefresh) {
      const lastRefresh = parseInt(savedLastRefresh);
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefresh;
      
      if (timeSinceLastRefresh < COOLDOWN_DURATION) {
        setLastRefreshTime(lastRefresh);
        setRefreshCooldown(Math.ceil((COOLDOWN_DURATION - timeSinceLastRefresh) / 1000));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Cooldown timer effect
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setInterval(() => {
        setRefreshCooldown(prev => {
          if (prev <= 1) {
            setLastRefreshTime(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [refreshCooldown]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    navigate('/regdata');
  };

  const goToPsAdmin = () => {
    navigate('/regdata/ps');
  };

  const fetchRegistrations = async () => {
    // Check if cooldown is active
    if (refreshCooldown > 0) {
      return;
    }
    
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'registrations'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      
      // Sort by timestamp descending (newest first)
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setRegistrations(data);
      
      // Set cooldown after successful fetch
      const now = Date.now();
      setLastRefreshTime(now);
      localStorage.setItem('lastRefreshTime', now.toString());
      setRefreshCooldown(COOLDOWN_DURATION / 1000); // Convert to seconds
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Failed to fetch registrations. Please check your Firebase connection.');
    } finally {
      setLoading(false);
    }
  };

  // Find duplicate transaction IDs
  const getDuplicateTransactionIds = () => {
    const txnIdCounts = registrations.reduce((acc, reg) => {
      const txnId = reg.transactionId || '';
      if (txnId && !txnId.startsWith('TEMP_')) {
        acc[txnId] = (acc[txnId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(txnIdCounts).filter(id => txnIdCounts[id] > 1);
  };

  const duplicateTransactionIds = getDuplicateTransactionIds();
  const hasDuplicates = (reg: Registration) => {
    return duplicateTransactionIds.includes(reg.transactionId);
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      (reg.teamName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.teamMembers || []).some(member => 
        (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phoneNumber || '').includes(searchTerm)
      );
    
    const matchesFilter = eventFilter === 'all' || reg.eventType === eventFilter;
    
    const matchesDuplicateFilter = 
      duplicateFilter === 'all' ||
      (duplicateFilter === 'duplicates' && hasDuplicates(reg)) ||
      (duplicateFilter === 'unique' && !hasDuplicates(reg));
    
    return matchesSearch && matchesFilter && matchesDuplicateFilter;
  });

  const exportToExcel = () => {
    if (filteredRegistrations.length === 0) {
      alert('No data to export');
      return;
    }

    // Flatten the data for Excel
    const excelData = filteredRegistrations.flatMap(reg => 
      reg.teamMembers.map((member, index) => ({
        'Registration ID': reg.id,
        'Event Type': reg.eventType.toUpperCase(),
        'Team Name': reg.teamName,
        'Team Size': reg.teamSize,
        'Price (₹)': reg.price,
        'Transaction ID': reg.transactionId,
        'Registration Time': new Date(reg.timestamp).toLocaleString(),
        'Member #': index + 1,
        'Member Name': member.name,
        'Email': member.email,
        'Phone': member.phoneNumber,
        'College': member.collegeType === 'CBIT' ? 'CBIT' : member.customCollege,
        'Degree': member.degreeType === 'Other' ? member.customDegree : member.degreeType,
        'Year of Study': member.yearOfStudy,
        'Branch': member.branch === 'Other' ? member.customBranch : member.branch,
        'Roll Number': member.rollNumber,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    
    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...excelData.map(row => String(row[key as keyof typeof row] || '').length)
        )
      )
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `CyberFest_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportEmailsToCSV = (filterType: 'all' | 'non-rejected' | 'confirmed' | 'non-confirmed-non-rejected') => {
    let dataToExport = filteredRegistrations;
    
    if (filterType === 'non-rejected') {
      dataToExport = dataToExport.filter(reg => reg.isValid !== false);
    } else if (filterType === 'confirmed') {
      dataToExport = dataToExport.filter(reg => reg.confirmationSent && reg.isValid !== false);
    } else if (filterType === 'non-confirmed-non-rejected') {
      dataToExport = dataToExport.filter(reg => reg.isValid !== false && !reg.confirmationSent);
    }

    if (dataToExport.length === 0) {
      alert('No data to export for selected filter');
      return;
    }

    // Create CSV data with all team members
    const csvData = dataToExport.flatMap(reg => 
      reg.teamMembers.map(member => ({
        Name: member.name,
        Email: member.email,
        'Team Name': reg.teamName,
        'Event Type': reg.eventType.toUpperCase(),
      }))
    );

    // Convert to CSV
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CyberFest_Emails_${filterType}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // NEW EXPORT FUNCTIONS
  
  const exportCheckedInTeams = () => {
    const checkedIn = registrations.filter(r => r.checkedIn);
    const data = checkedIn.map(reg => ({
      'Team Name': reg.teamName,
      'Event Type': reg.eventType.toUpperCase(),
      'Team Size': reg.teamMembers.length,
      'Checked In At': reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : '',
      'Team Leader': reg.teamMembers[0]?.name || '',
      'Phone': reg.teamMembers[0]?.phoneNumber || '',
      'Email': reg.teamMembers[0]?.email || ''
    }));
    
    downloadCSV(data, `CheckedIn_Teams_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportLabWiseTeams = () => {
    const assigned = registrations.filter(r => r.finalLab);
    const data = assigned.map(reg => ({
      'Lab': reg.finalLab,
      'Team Name': reg.teamName,
      'Event Type': reg.eventType.toUpperCase(),
      'Team Size': reg.teamMembers.length,
      'Lab Attendance': reg.labAttendance ? 'Present' : 'Absent',
      'Team Leader': reg.teamMembers[0]?.name || '',
      'Phone': reg.teamMembers[0]?.phoneNumber || ''
    }));
    
    downloadCSV(data, `Lab_Wise_Teams_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportFoodCounts = () => {
    const data: Array<Record<string, string | number>> = [];
    
    registrations.filter(r => r.isValid !== false).forEach(reg => {
      const tracking = reg.foodTracking || {
        lunch6th: false,
        dinner6th: false,
        breakfast7th: false,
        lunch7th: false
      };
      data.push({
        'Team Name': reg.teamName,
        'Team Size': reg.teamMembers.length,
        'Lunch 6th': tracking.lunch6th ? 'Yes' : 'No',
        'Dinner 6th': tracking.dinner6th ? 'Yes' : 'No',
        'Breakfast 7th': tracking.breakfast7th ? 'Yes' : 'No',
        'Lunch 7th': tracking.lunch7th ? 'Yes' : 'No',
        'Total Meals': [tracking.lunch6th, tracking.dinner6th, tracking.breakfast7th, tracking.lunch7th].filter(Boolean).length
      });
    });
    
    downloadCSV(data, `Food_Tracking_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportEmergencyContacts = () => {
    const data: Array<Record<string, string>> = [];
    
    registrations.filter(r => r.isValid !== false).forEach(reg => {
      const emergencyMember = reg.teamMembers.find(m => m.isEmergencyContact) || reg.teamMembers[0];
      data.push({
        'Team Name': reg.teamName,
        'Event Type': reg.eventType.toUpperCase(),
        'Emergency Contact Name': emergencyMember.name,
        'Phone': emergencyMember.phoneNumber,
        'Email': emergencyMember.email,
        'College': emergencyMember.college || emergencyMember.customCollege
      });
    });
    
    downloadCSV(data, `Emergency_Contacts_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportVenueAttendance = () => {
    const data: Array<Record<string, string | number>> = [];
    
    ['venue1', 'venue2', 'venue3'].forEach(venue => {
      const venueTeams = registrations.filter(r => r.initialVenue === venue);
      venueTeams.forEach(reg => {
        data.push({
          'Venue': venue.toUpperCase(),
          'Team Name': reg.teamName,
          'Team Size': reg.teamMembers.length,
          'Attendance': reg.initialVenueAttendance ? 'Present' : 'Absent',
          'Team Leader': reg.teamMembers[0]?.name || '',
          'Phone': reg.teamMembers[0]?.phoneNumber || ''
        });
      });
    });
    
    downloadCSV(data, `Venue_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportKitDistribution = () => {
    const data = registrations.filter(r => r.isValid !== false).flatMap(reg => 
      reg.teamMembers.map((member, idx) => ({
        'Team Name': reg.teamName,
        'Member Name': member.name,
        'T-Shirt Size': member.tshirtSize || 'Not Set',
        'Welcome Kit': reg.welcomeKitReceived ? 'Received' : 'Pending',
        'T-Shirt': reg.tshirtsDistributed ? 'Received' : 'Pending',
        'ID Card': reg.idCardDistributed ? 'Received' : 'Pending',
        'Distributed At': reg.kitDistributedAt ? new Date(reg.kitDistributedAt).toLocaleString() : ''
      }))
    );
    
    downloadCSV(data, `Kit_Distribution_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const downloadCSV = (data: Array<Record<string, string | number | boolean>>, filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // FIREBASE BACKUP FUNCTIONS
  
  const exportFullBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      totalRegistrations: registrations.length,
      data: registrations
    };
    
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CyberFest_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    setLastBackupTime(new Date().toISOString());
    localStorage.setItem('lastBackupTime', new Date().toISOString());
    alert(`Backup complete! ${registrations.length} registrations exported.`);
  };

  const importFromBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      
      if (!backup.data || !Array.isArray(backup.data)) {
        alert('Invalid backup file format');
        return;
      }

      const confirm = window.confirm(
        `This will restore ${backup.data.length} registrations from ${new Date(backup.exportedAt).toLocaleString()}. ` +
        `This operation cannot be undone. Continue?`
      );
      
      if (!confirm) return;

      // Import data back to state (not Firebase to avoid hitting limits)
      setRegistrations(backup.data);
      alert(`Restored ${backup.data.length} registrations from backup. Note: This is loaded locally, not synced to Firebase.`);
    } catch (error) {
      console.error('Error importing backup:', error);
      alert('Failed to import backup file');
    }
  };

  // Auto-backup every 30 minutes if enabled
  useEffect(() => {
    if (!autoBackupEnabled || registrations.length === 0) return;
    
    const doBackup = () => {
      const backup = {
        exportedAt: new Date().toISOString(),
        totalRegistrations: registrations.length,
        data: registrations
      };
      
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CyberFest_AutoBackup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setLastBackupTime(new Date().toISOString());
      localStorage.setItem('lastBackupTime', new Date().toISOString());
    };
    
    const interval = setInterval(doBackup, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, [autoBackupEnabled, registrations]);

  const bulkConfirmNonRejected = async () => {
    const nonRejected = filteredRegistrations.filter(reg => reg.isValid !== false && !reg.confirmationSent);
    
    if (nonRejected.length === 0) {
      alert('No unconfirmed registrations to mark as confirmed');
      return;
    }

    const confirm = window.confirm(
      `Mark ${nonRejected.length} non-rejected registrations as CONFIRMED?\n\nThis should be done AFTER sending emails via Python script.`
    );

    if (!confirm) return;

    try {
      // Update all non-rejected registrations
      const updatePromises = nonRejected.map(reg =>
        updateDoc(doc(db, 'registrations', reg.id), {
          confirmationSent: true,
          confirmedAt: new Date().toISOString(),
          isValid: true,
        })
      );

      await Promise.all(updatePromises);

      // Update local state
      setRegistrations(prev =>
        prev.map(reg =>
          nonRejected.find(nr => nr.id === reg.id)
            ? { ...reg, confirmationSent: true, confirmedAt: new Date().toISOString(), isValid: true }
            : reg
        )
      );

      alert(`Successfully marked ${nonRejected.length} registrations as confirmed!`);
    } catch (error) {
      console.error('Error bulk confirming:', error);
      alert('Failed to bulk confirm. Check console for details.');
    }
  };

  const addTeamMember = (registration: Registration) => {
    if (registration.teamMembers.length >= 5) {
      alert('Maximum 5 team members allowed');
      return;
    }

    // Open modal to add member with details
    setAddingMember({
      regId: registration.id,
      newMember: {
        name: '',
        college: 'CBIT',
        collegeType: 'CBIT',
        customCollege: '',
        degreeType: 'B.Tech',
        customDegree: '',
        degree: 'B.Tech',
        yearOfStudy: '1st Year',
        branch: 'CSE',
        branchType: 'Listed',
        customBranch: '',
        rollNumber: '',
        email: '',
        phoneNumber: '',
      }
    });
  };

  const saveNewMember = async () => {
    if (!addingMember) return;

    const { regId, newMember } = addingMember;
    
    // Validate required fields
    if (!newMember.name?.trim() || !newMember.email?.trim() || !newMember.phoneNumber?.trim()) {
      alert('Please fill in all required fields: Name, Email, and Phone Number');
      return;
    }

    const registration = registrations.find(r => r.id === regId);
    if (!registration) return;

    try {
      const completeMember: TeamMember = {
        name: newMember.name!,
        email: newMember.email!,
        phoneNumber: newMember.phoneNumber!,
        college: newMember.college || 'CBIT',
        collegeType: newMember.collegeType || 'CBIT',
        customCollege: newMember.customCollege || '',
        degreeType: newMember.degreeType || 'B.Tech',
        customDegree: newMember.customDegree || '',
        degree: newMember.degree || 'B.Tech',
        yearOfStudy: newMember.yearOfStudy || '1st Year',
        branch: newMember.branch || 'CSE',
        branchType: newMember.branchType || 'Listed',
        customBranch: newMember.customBranch || '',
        rollNumber: newMember.rollNumber || '',
      };

      const updatedMembers = [...registration.teamMembers, completeMember];
      await updateDoc(doc(db, 'registrations', regId), {
        teamMembers: updatedMembers,
        teamSize: updatedMembers.length,
      });

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === regId
            ? { ...reg, teamMembers: updatedMembers, teamSize: updatedMembers.length }
            : reg
        )
      );

      setAddingMember(null);
      alert('Team member added successfully!');
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member. Check Firebase rules.');
    }
  };

  const openEditMember = (regId: string, memberIndex: number, member: TeamMember) => {
    setEditingMember({ regId, memberIndex, member: { ...member } });
  };

  const saveMemberEdit = async () => {
    if (!editingMember) return;

    const { regId, memberIndex, member } = editingMember;
    const registration = registrations.find(r => r.id === regId);
    if (!registration) return;

    // Validate required fields
    if (!member.name?.trim() || !member.email?.trim() || !member.phoneNumber?.trim()) {
      alert('Please fill in all required fields: Name, Email, and Phone Number');
      return;
    }

    try {
      const updatedMembers = [...registration.teamMembers];
      updatedMembers[memberIndex] = member;

      await updateDoc(doc(db, 'registrations', regId), {
        teamMembers: updatedMembers,
      });

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === regId
            ? { ...reg, teamMembers: updatedMembers }
            : reg
        )
      );

      setEditingMember(null);
      alert('Team member updated successfully!');
    } catch (error) {
      console.error('Error updating team member:', error);
      alert('Failed to update team member. Check Firebase rules.');
    }
  };

  const deleteTeamMember = async (regId: string, memberIndex: number) => {
    const registration = registrations.find(r => r.id === regId);
    if (!registration) return;

    if (registration.teamMembers.length <= 1) {
      alert('Cannot delete the only team member. Delete the entire registration instead.');
      return;
    }

    const member = registration.teamMembers[memberIndex];
    const confirm = window.confirm(
      `Delete team member?\n\nName: ${member.name}\nEmail: ${member.email}\n\nThis action cannot be undone.`
    );

    if (!confirm) return;

    try {
      const updatedMembers = registration.teamMembers.filter((_, idx) => idx !== memberIndex);
      await updateDoc(doc(db, 'registrations', regId), {
        teamMembers: updatedMembers,
        teamSize: updatedMembers.length,
      });

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === regId
            ? { ...reg, teamMembers: updatedMembers, teamSize: updatedMembers.length }
            : reg
        )
      );

      alert('Team member deleted successfully!');
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Failed to delete team member. Check Firebase rules.');
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    const confirmMsg = 
      `Import registrations from "${file.name}"?\n\n` +
      `This will:\n` +
      `• Add new registrations to Firebase\n` +
      `• Skip duplicates (same transaction ID)\n` +
      `• Validate all team member data\n` +
      `• Show detailed import results\n\n` +
      `File size: ${(file.size / 1024).toFixed(2)} KB`;

    const confirm = window.confirm(confirmMsg);

    if (!confirm) {
      event.target.value = '';
      return;
    }

    setImportingCSV(true);

    try {
      const result = await importCSVToFirebase(file);
      
      let message = `Import Summary\n\n`;
      message += `✓ Successfully imported: ${result.success}\n`;
      message += `✗ Failed/Skipped: ${result.failed}\n`;
      
      if (result.errors.length > 0) {
        message += `⚠ Issues: ${result.errors.length} (check console for details)\n\n`;
        message += `First few issues:\n${result.errors.slice(0, 3).join('\n')}`;
        if (result.errors.length > 3) {
          message += `\n... and ${result.errors.length - 3} more`;
        }
      }
      
      alert(message);
      
      // Refresh registrations if any were imported
      if (result.success > 0) {
        await fetchRegistrations();
      }
    } catch (error) {
      console.error('CSV import error:', error);
      alert(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportingCSV(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleJSONImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('Please select a JSON file');
      return;
    }

    const confirm = window.confirm(
      `Import registrations from "${file.name}"?\n\nThis will add all registrations from the JSON file to Firebase.`
    );

    if (!confirm) {
      event.target.value = '';
      return;
    }

    setImportingJSON(true);

    try {
      const text = await file.text();
      const registrations = JSON.parse(text);

      if (!Array.isArray(registrations)) {
        throw new Error('JSON file must contain an array of registrations');
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < registrations.length; i++) {
        const reg = registrations[i];
        try {
          // Check for duplicates
          const q = query(
            collection(db, 'registrations'),
            where('transactionId', '==', reg.transactionId)
          );
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            await addDoc(collection(db, 'registrations'), reg);
            success++;
            console.log(`✓ Imported: ${reg.teamName}`);
          } else {
            errors.push(`${reg.teamName} - Duplicate transaction ID`);
            failed++;
          }
        } catch (error) {
          failed++;
          errors.push(`${reg.teamName} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      let message = `JSON Import Summary\n\n`;
      message += `✓ Successfully imported: ${success}\n`;
      message += `✗ Failed/Skipped: ${failed}\n`;
      
      if (errors.length > 0) {
        message += `\nFirst few issues:\n${errors.slice(0, 3).join('\n')}`;
        if (errors.length > 3) {
          message += `\n... and ${errors.length - 3} more`;
        }
      }
      
      alert(message);
      
      if (success > 0) {
        await fetchRegistrations();
      }
    } catch (error) {
      console.error('JSON import error:', error);
      alert(`Failed to import JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImportingJSON(false);
      event.target.value = '';
    }
  };

  const openEditTeamDetails = (registration: Registration) => {
    setEditingTeamDetails({
      regId: registration.id,
      teamName: registration.teamName,
      eventType: registration.eventType,
    });
  };

  const saveTeamDetails = async () => {
    if (!editingTeamDetails) return;

    const { regId, teamName, eventType } = editingTeamDetails;

    if (!teamName.trim()) {
      alert('Team name cannot be empty');
      return;
    }

    const registration = registrations.find(r => r.id === regId);
    if (!registration) return;

    try {
      await updateDoc(doc(db, 'registrations', regId), {
        teamName: teamName.trim(),
        eventType,
      });

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === regId
            ? { ...reg, teamName: teamName.trim(), eventType }
            : reg
        )
      );

      setEditingTeamDetails(null);
      alert('Team details updated successfully!');
    } catch (error) {
      console.error('Error updating team details:', error);
      alert('Failed to update team details. Check Firebase rules.');
    }
  };

  const viewPaymentScreenshot = (registration: Registration) => {
    setSelectedRegistration(registration);
  };

  const getTotalRevenue = () => {
    return filteredRegistrations
      .filter(reg => reg.isValid !== false)
      .reduce((sum, reg) => sum + reg.price, 0);
  };

  const getTotalParticipants = () => {
    return filteredRegistrations.reduce((sum, reg) => sum + reg.teamMembers.length, 0);
  };

  const getRejectedParticipants = () => {
    return filteredRegistrations
      .filter(reg => reg.isValid === false)
      .reduce((sum, reg) => sum + reg.teamMembers.length, 0);
  };

  const getValidParticipants = () => {
    return filteredRegistrations
      .filter(reg => reg.isValid !== false)
      .reduce((sum, reg) => sum + reg.teamMembers.length, 0);
  };

  const getConfirmedCount = () => {
    return filteredRegistrations.filter(reg => reg.confirmationSent && reg.isValid !== false).length;
  };

  const getRejectedCount = () => {
    return filteredRegistrations.filter(reg => reg.isValid === false).length;
  };

  const getRegistrationTimeline = () => {
    // Group registrations by date
    const groupedByDate = registrations.reduce((acc, reg) => {
      const date = new Date(reg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, total: 0, hackathon: 0, ctf: 0 };
      }
      acc[date].total++;
      if (reg.eventType === 'hackathon') {
        acc[date].hackathon++;
      } else {
        acc[date].ctf++;
      }
      return acc;
    }, {} as Record<string, { date: string; total: number; hackathon: number; ctf: number }>);

    // Convert to array and sort by date
    return Object.values(groupedByDate).sort((a, b) => {
      const dateA = new Date(a.date + ', 2026');
      const dateB = new Date(b.date + ', 2026');
      return dateA.getTime() - dateB.getTime();
    });
  };

  const sendConfirmationEmail = async (registration: Registration) => {
    if (registration.isValid === false) {
      alert('Cannot send confirmation to a rejected registration.');
      return;
    }

    const resend = registration.confirmationSent;
    const confirmMessage = resend
      ? `Resend confirmation email to ${registration.teamName}?\n\nTeam Leader: ${registration.teamMembers[0]?.name}\nEmail: ${registration.teamMembers[0]?.email}`
      : `Send confirmation email to ${registration.teamName}?\n\nTeam Leader: ${registration.teamMembers[0]?.name}\nEmail: ${registration.teamMembers[0]?.email}`;

    const confirm = window.confirm(confirmMessage);

    if (!confirm) return;

    try {
      // Prepare email content
      const teamLeader = registration.teamMembers[0];
      const subject = `Registration Confirmed - CyberFest 2026 ${registration.eventType.toUpperCase()}`;
      const body = `Dear ${teamLeader.name},\n\nYour registration for CyberFest 2026 ${registration.eventType.toUpperCase()} has been confirmed!\n\nTeam Details:\n- Team Name: ${registration.teamName}\n- Team Size: ${registration.teamSize}\n- Event Type: ${registration.eventType.toUpperCase()}\n- Transaction ID: ${registration.transactionId}\n\nTeam Members:\n${registration.teamMembers.map((m, i) => `${i + 1}. ${m.name} (${m.email})`).join('\n')}\n\nLooking forward to seeing you at the event!\n\nBest regards,\nCyberFest 2026 Team`;

      // Copy email content to clipboard
      const emailContent = `To: ${teamLeader.email}\nSubject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(emailContent);

      // Try to open email client (may not work in all browsers)
      const mailtoLink = `mailto:${teamLeader.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      // Mark as confirmed in Firestore
      await updateDoc(doc(db, 'registrations', registration.id), {
        confirmationSent: true,
        confirmedAt: new Date().toISOString(),
        isValid: true,
      });

      // Update local state
      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registration.id
            ? { ...reg, confirmationSent: true, confirmedAt: new Date().toISOString(), isValid: true }
            : reg
        )
      );

      alert(`Email content copied to clipboard!\n\n${resend ? 'Resent' : 'Sent'} to: ${teamLeader.email}\n\nPaste it in your email client and send.`);
    } catch (error) {
      console.error('Error sending confirmation:', error);
      alert('Failed to mark as confirmed. Check console for details.');
    }
  };

  const markAsInvalid = async (registration: Registration) => {
    if (registration.isValid === false) {
      alert('This registration is already marked as invalid.');
      return;
    }

    const reason = window.prompt(
      `Mark "${registration.teamName}" as INVALID?\n\nThis will reject their registration.\n\nReason (optional):`,
      'Payment verification failed'
    );

    if (reason === null) return; // User cancelled

    try {
      await updateDoc(doc(db, 'registrations', registration.id), {
        isValid: false,
        rejectedAt: new Date().toISOString(),
        confirmationSent: false,
      });

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registration.id
            ? { ...reg, isValid: false, rejectedAt: new Date().toISOString(), confirmationSent: false }
            : reg
        )
      );

      alert(`Registration marked as INVALID${reason ? `: ${reason}` : ''}`);
    } catch (error) {
      console.error('Error marking as invalid:', error);
      alert('Failed to mark as invalid. Check Firebase rules.');
    }
  };

  const unconfirmRegistration = async (registration: Registration) => {
    if (!registration.confirmationSent) {
      alert('This registration is not confirmed yet.');
      return;
    }

    const confirm = window.confirm(
      `Unconfirm "${registration.teamName}"?\n\nThis will mark the registration as not confirmed, allowing you to send emails to them again.`
    );

    if (!confirm) return;

    try {
      await updateDoc(doc(db, 'registrations', registration.id), {
        confirmationSent: false,
        confirmedAt: null,
      });

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registration.id
            ? { ...reg, confirmationSent: false, confirmedAt: undefined }
            : reg
        )
      );

      alert('Registration unconfirmed successfully!');
    } catch (error) {
      console.error('Error unconfirming:', error);
      alert('Failed to unconfirm. Check Firebase rules.');
    }
  };

  const markAsValid = async (registration: Registration) => {
    if (registration.isValid !== false) {
      alert('This registration is already valid.');
      return;
    }

    const confirm = window.confirm(
      `Mark "${registration.teamName}" as VALID?\n\nThis will restore their registration and make them eligible for confirmation emails.`
    );

    if (!confirm) return;

    try {
      await updateDoc(doc(db, 'registrations', registration.id), {
        isValid: true,
        rejectedAt: null,
      });

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === registration.id
            ? { ...reg, isValid: true, rejectedAt: undefined }
            : reg
        )
      );

      alert('Registration marked as VALID successfully!');
    } catch (error) {
      console.error('Error marking as valid:', error);
      alert('Failed to mark as valid. Check Firebase rules.');
    }
  };

  const openEditPayment = (registration: Registration) => {
    setEditingPayment(registration);
    setNewTransactionId(registration.transactionId);
    setNewPaymentScreenshot(null);
  };

  const compressImage = async (file: File, maxSizeKB: number = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Failed to get canvas context'));

          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.8;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
            quality -= 0.1;
            compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const updatePaymentDetails = async () => {
    if (!editingPayment) return;

    if (!newTransactionId.trim()) {
      alert('Transaction ID is required');
      return;
    }

    try {
      const updates: Record<string, string | undefined> = {
        transactionId: newTransactionId,
      };

      if (newPaymentScreenshot) {
        const base64Image = await compressImage(newPaymentScreenshot, 400);
        const sizeInKB = (base64Image.length * 0.75) / 1024;
        if (sizeInKB > 500) {
          alert('Image is too large. Please use a smaller image.');
          return;
        }
        updates.paymentScreenshot = base64Image;
        updates.paymentScreenshotName = newPaymentScreenshot.name;
      }

      await updateDoc(doc(db, 'registrations', editingPayment.id), updates);

      setRegistrations(prev =>
        prev.map(reg =>
          reg.id === editingPayment.id
            ? { ...reg, ...updates }
            : reg
        )
      );

      alert('Payment details updated successfully!');
      setEditingPayment(null);
      setNewTransactionId('');
      setNewPaymentScreenshot(null);
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Failed to update payment details. Check console for details.');
    }
  };

  // EVENT MANAGEMENT FUNCTIONS
  
  // Check-in Functions
  const handleCheckIn = async (regId: string) => {
    try {
      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, {
        checkedIn: true,
        checkedInAt: new Date().toISOString()
      });
      setRegistrations(prev => prev.map(reg => 
        reg.id === regId ? { ...reg, checkedIn: true, checkedInAt: new Date().toISOString() } : reg
      ));
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in team');
    }
  };

  const handleBulkCheckIn = async (regIds: string[]) => {
    try {
      const updates = regIds.map(regId => {
        const regDoc = doc(db, 'registrations', regId);
        return updateDoc(regDoc, {
          checkedIn: true,
          checkedInAt: new Date().toISOString()
        });
      });
      await Promise.all(updates);
      await fetchRegistrations();
      alert(`Successfully checked in ${regIds.length} teams`);
    } catch (error) {
      console.error('Error bulk check-in:', error);
      alert('Failed to check in teams');
    }
  };

  // Venue Assignment Functions
  const assignToVenues = async () => {
    const nonRejected = registrations.filter(r => r.isValid !== false && !r.initialVenue);
    const total = nonRejected.length;
    
    if (venue1Count + venue2Count + venue3Count !== total) {
      alert(`Total must equal ${total}. Current: ${venue1Count + venue2Count + venue3Count}`);
      return;
    }

    try {
      let venue1Assigned = 0;
      let venue2Assigned = 0;
      let venue3Assigned = 0;

      for (const reg of nonRejected) {
        let venue: 'venue1' | 'venue2' | 'venue3';
        
        if (venue1Assigned < venue1Count) {
          venue = 'venue1';
          venue1Assigned++;
        } else if (venue2Assigned < venue2Count) {
          venue = 'venue2';
          venue2Assigned++;
        } else {
          venue = 'venue3';
          venue3Assigned++;
        }

        const regDoc = doc(db, 'registrations', reg.id);
        await updateDoc(regDoc, { initialVenue: venue });
      }

      await fetchRegistrations();
      setVenueAssignmentMode(false);
      alert('Venue assignment complete!');
    } catch (error) {
      console.error('Error assigning venues:', error);
      alert('Failed to assign venues');
    }
  };

  const markVenueAttendance = async (regId: string, present: boolean) => {
    try {
      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { initialVenueAttendance: present });
      setRegistrations(prev => prev.map(reg => 
        reg.id === regId ? { ...reg, initialVenueAttendance: present } : reg
      ));
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  // Lab Assignment Functions
  const assignLabsAutomatically = async () => {
    const hackathonTeams = registrations.filter(r => r.eventType === 'hackathon' && r.isValid !== false && !r.finalLab);
    const ctfTeams = registrations.filter(r => r.eventType === 'ctf' && r.isValid !== false && !r.finalLab);

    const totalLabCount = Object.values(labCounts).reduce((sum, count) => sum + count, 0);
    if (totalLabCount !== hackathonTeams.length) {
      alert(`Hackathon lab counts must equal ${hackathonTeams.length}. Current: ${totalLabCount}`);
      return;
    }

    try {
      // Assign CTF teams to CTF lab
      for (const team of ctfTeams) {
        const regDoc = doc(db, 'registrations', team.id);
        await updateDoc(regDoc, { finalLab: 'ctf-lab' });
      }

      // Assign Hackathon teams based on counts
      const labs = ['hack-lab1', 'hack-lab2', 'hack-lab3', 'hack-lab4', 'hack-lab5', 'hack-lab6', 'hack-lab7', 'hack-lab8', 'hack-lab9'];
      let teamIndex = 0;

      for (const lab of labs) {
        const count = labCounts[lab] || 0;
        for (let i = 0; i < count && teamIndex < hackathonTeams.length; i++) {
          const team = hackathonTeams[teamIndex];
          const regDoc = doc(db, 'registrations', team.id);
          await updateDoc(regDoc, { finalLab: lab });
          teamIndex++;
        }
      }

      await fetchRegistrations();
      setLabAssignmentMode(false);
      alert('Lab assignment complete!');
    } catch (error) {
      console.error('Error assigning labs:', error);
      alert('Failed to assign labs');
    }
  };

  const assignToLab = async (regId: string, lab: string) => {
    try {
      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { finalLab: lab });
      setRegistrations(prev => prev.map(reg => 
        reg.id === regId ? { ...reg, finalLab: lab as Registration['finalLab'] } : reg
      ));
    } catch (error) {
      console.error('Error assigning lab:', error);
      alert('Failed to assign lab');
    }
  };

  const markLabAttendance = async (regId: string, present: boolean) => {
    try {
      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { labAttendance: present });
      setRegistrations(prev => prev.map(reg => 
        reg.id === regId ? { ...reg, labAttendance: present } : reg
      ));
    } catch (error) {
      console.error('Error marking lab attendance:', error);
      alert('Failed to mark lab attendance');
    }
  };

  // Food Tracking Functions
  const toggleFood = async (regId: string, meal: keyof FoodTracking) => {
    try {
      const reg = registrations.find(r => r.id === regId);
      if (!reg) return;

      const currentTracking = reg.foodTracking || {
        lunch6th: false,
        dinner6th: false,
        breakfast7th: false,
        lunch7th: false
      };

      const updatedTracking = {
        ...currentTracking,
        [meal]: !currentTracking[meal]
      };

      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { foodTracking: updatedTracking });
      
      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, foodTracking: updatedTracking } : r
      ));
    } catch (error) {
      console.error('Error toggling food:', error);
      alert('Failed to update food tracking');
    }
  };

  // Kit Distribution Functions
  const toggleKit = async (regId: string, kitType: 'welcomeKitReceived' | 'tshirtsDistributed' | 'idCardDistributed') => {
    try {
      const reg = registrations.find(r => r.id === regId);
      if (!reg) return;

      const newValue = !reg[kitType];
      const updates: Partial<Registration> = { [kitType]: newValue };
      
      if (newValue && !reg.kitDistributedAt) {
        updates.kitDistributedAt = new Date().toISOString();
      }

      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, updates);
      
      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, ...updates } : r
      ));
    } catch (error) {
      console.error('Error toggling kit:', error);
      alert('Failed to update kit distribution');
    }
  };

  const updateTshirtSize = async (regId: string, memberIndex: number, size: string) => {
    try {
      const reg = registrations.find(r => r.id === regId);
      if (!reg) return;

      const updatedMembers = [...reg.teamMembers];
      updatedMembers[memberIndex] = { 
        ...updatedMembers[memberIndex], 
        tshirtSize: size as TeamMember['tshirtSize']
      };

      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { teamMembers: updatedMembers });
      
      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, teamMembers: updatedMembers } : r
      ));
    } catch (error) {
      console.error('Error updating t-shirt size:', error);
    }
  };

  const setEmergencyContact = async (regId: string, memberIndex: number) => {
    try {
      const reg = registrations.find(r => r.id === regId);
      if (!reg) return;

      const updatedMembers = reg.teamMembers.map((m, idx) => ({
        ...m,
        isEmergencyContact: idx === memberIndex
      }));

      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { teamMembers: updatedMembers });
      
      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, teamMembers: updatedMembers } : r
      ));
    } catch (error) {
      console.error('Error setting emergency contact:', error);
      alert('Failed to set emergency contact');
    }
  };

  // Movement Tracking Functions
  const addMovement = async (regId: string, type: Movement['type'], notes?: string) => {
    try {
      const reg = registrations.find(r => r.id === regId);
      if (!reg) return;

      const newMovement: Movement = {
        type,
        timestamp: new Date().toISOString(),
        notes
      };

      const movements = [...(reg.movements || []), newMovement];

      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { movements });
      
      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, movements } : r
      ));
    } catch (error) {
      console.error('Error adding movement:', error);
      alert('Failed to add movement');
    }
  };

  // Remarks Functions
  const updateRemarks = async (regId: string, remarks: string) => {
    try {
      const regDoc = doc(db, 'registrations', regId);
      await updateDoc(regDoc, { remarks });
      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, remarks } : r
      ));
    } catch (error) {
      console.error('Error updating remarks:', error);
      alert('Failed to update remarks');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Registration Dashboard
            </h1>
            <p className="text-gray-400">CyberFest 2026 - Admin Panel</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={goToPsAdmin} variant="secondary">
              Problem Statements
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'registrations'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Registrations
          </button>
          <button
            onClick={() => setActiveTab('event-management')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'event-management'
                ? 'border-b-2 border-purple-500 text-purple-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Event Management
          </button>
        </div>

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{filteredRegistrations.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Participants</CardTitle>
            </CardHeader>
            <CardContent>
              {getRejectedParticipants() > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-400 line-through">{getTotalParticipants()}</span>
                  <span className="text-lg font-bold text-gray-400">-</span>
                  <span className="text-lg font-bold text-red-400">{getRejectedParticipants()}</span>
                  <span className="text-lg font-bold text-gray-400">=</span>
                  <span className="text-2xl font-bold text-purple-400">{getValidParticipants()}</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-purple-400">{getTotalParticipants()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Hackathon Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {filteredRegistrations.filter(r => r.eventType === 'hackathon').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">CTF Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {filteredRegistrations.filter(r => r.eventType === 'ctf').length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">₹{getTotalRevenue().toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{getConfirmedCount()}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{getRejectedCount()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Timeline Chart */}
        {registrations.length > 0 && (
          <Card className="bg-gray-800/50 border-purple-500/20 mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Registration Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getRegistrationTimeline()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#9CA3AF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#A78BFA" 
                    strokeWidth={2}
                    name="Total Registrations"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hackathon" 
                    stroke="#60A5FA" 
                    strokeWidth={2}
                    name="Hackathon"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ctf" 
                    stroke="#34D399" 
                    strokeWidth={2}
                    name="CTF"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card className="bg-gray-800/50 border-purple-500/20 mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Row 1: Search and Refresh */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search - Takes most space */}
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by team name, email, phone, or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700 text-white w-full"
                  />
                </div>

                {/* Refresh Button */}
                <Button 
                  onClick={fetchRegistrations}
                  disabled={loading || refreshCooldown > 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  title={refreshCooldown > 0 ? `Available in ${Math.floor(refreshCooldown / 60)}:${String(refreshCooldown % 60).padStart(2, '0')}` : 'Refresh data'}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading 
                    ? 'Loading...' 
                    : refreshCooldown > 0 
                      ? `Wait ${Math.floor(refreshCooldown / 60)}:${String(refreshCooldown % 60).padStart(2, '0')}`
                      : 'Refresh Data'}
                </Button>
              </div>

              {/* Row 2: Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Event Filter */}
                <Select value={eventFilter} onValueChange={(value) => setEventFilter(value as 'all' | 'hackathon' | 'ctf')}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="ctf">CTF</SelectItem>
                  </SelectContent>
                </Select>

                {/* Duplicate Filter */}
                <Select value={duplicateFilter} onValueChange={(value) => setDuplicateFilter(value as 'all' | 'duplicates' | 'unique')}>
                  <SelectTrigger className="w-full sm:w-[220px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Duplicates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registrations</SelectItem>
                    <SelectItem value="duplicates">Duplicates Only ({duplicateTransactionIds.length > 0 ? registrations.filter(hasDuplicates).length : 0})</SelectItem>
                    <SelectItem value="unique">Unique Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* CSV Export Dropdown */}
                <Select onValueChange={(value) => exportEmailsToCSV(value as 'all' | 'non-rejected' | 'confirmed' | 'non-confirmed-non-rejected')}>
                  <SelectTrigger className="w-full sm:w-[220px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Export Emails CSV" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Participants</SelectItem>
                    <SelectItem value="non-rejected">Non-Rejected Only</SelectItem>
                    <SelectItem value="confirmed">Confirmed Only</SelectItem>
                    <SelectItem value="non-confirmed-non-rejected">Unconfirmed & Non-Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Export Button */}
                <Button 
                  onClick={exportToExcel}
                  variant="outline"
                  disabled={filteredRegistrations.length === 0}
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>

                {/* CSV Import Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                    id="csv-import"
                    disabled={importingCSV}
                  />
                  <Button
                    onClick={() => document.getElementById('csv-import')?.click()}
                    variant="outline"
                    disabled={importingCSV}
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {importingCSV ? 'Importing...' : 'Import CSV'}
                  </Button>
                </div>

                {/* JSON Import Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJSONImport}
                    className="hidden"
                    id="json-import"
                    disabled={importingJSON}
                  />
                  <Button
                    onClick={() => document.getElementById('json-import')?.click()}
                    variant="outline"
                    disabled={importingJSON}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {importingJSON ? 'Importing...' : 'Import JSON'}
                  </Button>
                </div>

                {/* Bulk Confirm Button */}
                <Button 
                  onClick={bulkConfirmNonRejected}
                  variant="outline"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Bulk Confirm
                </Button>

                {/* Additional Export Dropdowns */}
                <Select onValueChange={(value) => {
                  if (value === 'checked-in') exportCheckedInTeams();
                  else if (value === 'lab-wise') exportLabWiseTeams();
                  else if (value === 'food') exportFoodCounts();
                  else if (value === 'emergency') exportEmergencyContacts();
                  else if (value === 'venue') exportVenueAttendance();
                  else if (value === 'kit') exportKitDistribution();
                }}>
                  <SelectTrigger className="w-full sm:w-[220px] bg-gray-900/50 border-gray-700 text-white">
                    <SelectValue placeholder="Export Reports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checked-in">Checked-In Teams</SelectItem>
                    <SelectItem value="lab-wise">Lab-Wise Teams</SelectItem>
                    <SelectItem value="venue">Venue Attendance</SelectItem>
                    <SelectItem value="food">Food Tracking</SelectItem>
                    <SelectItem value="kit">Kit Distribution</SelectItem>
                    <SelectItem value="emergency">Emergency Contacts</SelectItem>
                  </SelectContent>
                </Select>

                {/* Firebase Backup */}
                <Button
                  onClick={exportFullBackup}
                  variant="outline"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                  title="Export full backup JSON"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Backup DB
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importFromBackup}
                    className="hidden"
                    id="backup-import"
                  />
                  <Button
                    onClick={() => document.getElementById('backup-import')?.click()}
                    variant="outline"
                    className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                    title="Restore from backup"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Restore DB
                  </Button>
                </div>
              </div>

              {/* Firebase Usage Warning */}
              {registrations.length > 100 && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/50 rounded">
                  <p className="text-sm text-yellow-400">
                    ⚠️ Large dataset detected ({registrations.length} teams). 
                    {lastBackupTime && ` Last backup: ${new Date(lastBackupTime).toLocaleTimeString()}.`}
                    {' '}Consider using local backups to avoid Firebase limits.
                  </p>
                  <label className="flex items-center gap-2 mt-2 text-xs">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300">Auto-backup every 30 minutes</span>
                  </label>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* No Data State */}
        {!loading && registrations.length === 0 && (
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardContent className="py-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">No Registrations Yet</h3>
              <p className="text-gray-400 mb-4">Click "Refresh Data" to load registrations from Firebase</p>
              <Button onClick={fetchRegistrations} className="bg-purple-600 hover:bg-purple-700">
                <RefreshCw className="mr-2 h-4 w-4" />
                Load Registrations
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Registrations List */}
        {!loading && filteredRegistrations.length > 0 && (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <Card key={registration.id} className="bg-gray-800/50 border-purple-500/20 hover:border-purple-500/50 transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold">{registration.teamName}</h3>
                        <Button
                          onClick={() => openEditTeamDetails(registration)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-purple-600"
                          title="Edit team name and event type"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Badge variant={registration.eventType === 'hackathon' ? 'default' : 'secondary'}>
                          {registration.eventType.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                          ₹{registration.price}
                        </Badge>
                        {hasDuplicates(registration) && (
                          <Badge variant="outline" className="text-orange-400 border-orange-400/50">
                            ⚠ Duplicate TXN ID
                          </Badge>
                        )}
                        {registration.isValid === false && (
                          <Badge variant="outline" className="text-red-400 border-red-400/50">
                            ✕ Rejected
                          </Badge>
                        )}
                        {registration.confirmationSent && registration.isValid !== false && (
                          <Badge variant="outline" className="text-green-400 border-green-400/50">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Confirmed
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>Team Size: {registration.teamSize}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(registration.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="mb-3 bg-gray-900/70 p-2 rounded flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500">Transaction ID:</span>
                            <p className="text-sm font-mono text-purple-300 mt-1">
                              {registration.transactionId}
                              {registration.transactionId?.startsWith('TEMP_') && (
                                <span className="ml-2 text-xs text-red-400">(Missing - Update Required)</span>
                              )}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(registration.transactionId);
                              alert('Transaction ID copied!');
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            Copy
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {registration.teamMembers.map((member, idx) => (
                            <div key={idx} className="text-sm bg-gray-900/50 p-3 rounded-lg relative group">
                              <div className="font-semibold text-purple-400 mb-1">Member {idx + 1}: {member.name}</div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-400">
                                <div>📧 {member.email}</div>
                                <div>📱 {member.phoneNumber}</div>
                                <div>🎓 {member.collegeType === 'CBIT' ? 'CBIT' : member.customCollege}</div>
                                <div>📚 {member.degreeType === 'Other' ? member.customDegree : member.degreeType} - Year {member.yearOfStudy}</div>
                                <div>💼 {member.branch === 'Other' ? member.customBranch : member.branch}</div>
                                <div>🆔 {member.rollNumber}</div>
                              </div>
                              {/* Edit and Delete buttons */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  onClick={() => openEditMember(registration.id, idx, member)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-blue-600"
                                  title="Edit member"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => deleteTeamMember(registration.id, idx)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 bg-gray-800/80 hover:bg-red-600"
                                  title="Delete member"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => viewPaymentScreenshot(registration)}
                        variant="outline"
                        size="sm"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        View Payment
                      </Button>
                      <Button
                        onClick={() => sendConfirmationEmail(registration)}
                        variant="outline"
                        size="sm"
                        disabled={registration.isValid === false}
                        className={registration.isValid === false
                          ? "border-gray-500/50 text-gray-500 opacity-50 cursor-not-allowed"
                          : registration.confirmationSent
                          ? "border-green-500/50 text-green-400 hover:bg-green-500/10" 
                          : "border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                        }
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        {registration.confirmationSent ? 'Resend Email' : 'Send Confirmation'}
                      </Button>
                      <Button
                        onClick={() => markAsInvalid(registration)}
                        variant="outline"
                        size="sm"
                        disabled={registration.isValid === false}
                        className={registration.isValid === false
                          ? "border-red-500/50 text-red-400 opacity-50 cursor-not-allowed"
                          : "border-red-500/50 text-red-400 hover:bg-red-500/10"
                        }
                      >
                        {registration.isValid === false ? 'Marked Invalid' : 'Mark as Invalid'}
                      </Button>
                      {registration.isValid === false && (
                        <>
                          <Button
                            onClick={() => markAsValid(registration)}
                            variant="outline"
                            size="sm"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                          >
                            Mark as Valid
                          </Button>
                          <Button
                            onClick={() => openEditPayment(registration)}
                            variant="outline"
                            size="sm"
                            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Payment
                          </Button>
                        </>
                      )}
                      {registration.confirmationSent && (
                        <Button
                          onClick={() => unconfirmRegistration(registration)}
                          variant="outline"
                          size="sm"
                          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          Unconfirm
                        </Button>
                      )}
                      {registration.teamMembers.length < 5 && (
                        <Button
                          onClick={() => addTeamMember(registration)}
                          variant="outline"
                          size="sm"
                          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Search Results */}
        {!loading && registrations.length > 0 && filteredRegistrations.length === 0 && (
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardContent className="py-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setEditingPayment(null)}
        >
          <div 
            className="bg-gray-900 border border-purple-500/50 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-purple-400">Edit Payment Details</h3>
            <p className="text-sm text-gray-400 mb-4">Team: {editingPayment.teamName}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Transaction ID</label>
                <Input
                  value={newTransactionId}
                  onChange={(e) => setNewTransactionId(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Screenshot (Optional)</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPaymentScreenshot(e.target.files?.[0] || null)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                {newPaymentScreenshot && (
                  <p className="text-xs text-green-400 mt-1">✓ New screenshot selected</p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={updatePaymentDetails}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Update Payment
                </Button>
                <Button
                  onClick={() => {
                    setEditingPayment(null);
                    setNewTransactionId('');
                    setNewPaymentScreenshot(null);
                  }}
                  variant="outline"
                  className="flex-1 border-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Screenshot Modal */}
      {selectedRegistration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedRegistration(null)}
        >
          <div 
            className="bg-gray-900 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedRegistration.teamName}</h3>
                <p className="text-sm text-gray-400">Transaction ID: {selectedRegistration.transactionId}</p>
              </div>
              <Button
                onClick={() => setSelectedRegistration(null)}
                variant="ghost"
                size="icon"
              >
                ×
              </Button>
            </div>
            <img 
              src={selectedRegistration.paymentScreenshot} 
              alt="Payment Screenshot" 
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-4">
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedRegistration.paymentScreenshot;
                  link.download = selectedRegistration.paymentScreenshotName;
                  link.click();
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Screenshot
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setEditingMember(null)}
        >
          <div 
            className="bg-gray-900 border border-purple-500/50 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-400">Edit Team Member</h3>
              <Button
                onClick={() => setEditingMember(null)}
                variant="ghost"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    value={editingMember.member.name}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, name: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    value={editingMember.member.email}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, email: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <Input
                    value={editingMember.member.phoneNumber}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, phoneNumber: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="10-digit number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">College</label>
                  <Select 
                    value={editingMember.member.collegeType}
                    onValueChange={(value) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, collegeType: value, college: value }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBIT">CBIT</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingMember.member.collegeType === 'Other' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Custom College Name</label>
                    <Input
                      value={editingMember.member.customCollege}
                      onChange={(e) => setEditingMember({
                        ...editingMember,
                        member: { ...editingMember.member, customCollege: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter college name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Degree Type</label>
                  <Select 
                    value={editingMember.member.degreeType}
                    onValueChange={(value) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, degreeType: value, degree: value }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech">B.Tech</SelectItem>
                      <SelectItem value="B.E">B.E</SelectItem>
                      <SelectItem value="M.Tech">M.Tech</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingMember.member.degreeType === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Degree</label>
                    <Input
                      value={editingMember.member.customDegree}
                      onChange={(e) => setEditingMember({
                        ...editingMember,
                        member: { ...editingMember.member, customDegree: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter degree"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Year of Study</label>
                  <Select 
                    value={editingMember.member.yearOfStudy}
                    onValueChange={(value) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, yearOfStudy: value }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Branch/Department</label>
                  <Input
                    value={editingMember.member.branch}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, branch: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="e.g., CSE, ECE, IT"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Roll Number / Registration Number</label>
                  <Input
                    value={editingMember.member.rollNumber}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      member: { ...editingMember.member, rollNumber: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter roll/registration number"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <Button
                  onClick={saveMemberEdit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => setEditingMember(null)}
                  variant="outline"
                  className="flex-1 border-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {addingMember && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setAddingMember(null)}
        >
          <div 
            className="bg-gray-900 border border-purple-500/50 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-400">Add New Team Member</h3>
              <Button
                onClick={() => setAddingMember(null)}
                variant="ghost"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name *</label>
                  <Input
                    value={addingMember.newMember.name || ''}
                    onChange={(e) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, name: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <Input
                    type="email"
                    value={addingMember.newMember.email || ''}
                    onChange={(e) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, email: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <Input
                    value={addingMember.newMember.phoneNumber || ''}
                    onChange={(e) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, phoneNumber: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="10-digit number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">College</label>
                  <Select 
                    value={addingMember.newMember.collegeType || 'CBIT'}
                    onValueChange={(value) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, collegeType: value, college: value }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBIT">CBIT</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {addingMember.newMember.collegeType === 'Other' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Custom College Name</label>
                    <Input
                      value={addingMember.newMember.customCollege || ''}
                      onChange={(e) => setAddingMember({
                        ...addingMember,
                        newMember: { ...addingMember.newMember, customCollege: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter college name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Degree Type</label>
                  <Select 
                    value={addingMember.newMember.degreeType || 'B.Tech'}
                    onValueChange={(value) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, degreeType: value, degree: value }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B.Tech">B.Tech</SelectItem>
                      <SelectItem value="B.E">B.E</SelectItem>
                      <SelectItem value="M.Tech">M.Tech</SelectItem>
                      <SelectItem value="MCA">MCA</SelectItem>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {addingMember.newMember.degreeType === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Custom Degree</label>
                    <Input
                      value={addingMember.newMember.customDegree || ''}
                      onChange={(e) => setAddingMember({
                        ...addingMember,
                        newMember: { ...addingMember.newMember, customDegree: e.target.value }
                      })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter degree"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Year of Study</label>
                  <Select 
                    value={addingMember.newMember.yearOfStudy || '1st Year'}
                    onValueChange={(value) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, yearOfStudy: value }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Branch/Department</label>
                  <Input
                    value={addingMember.newMember.branch || ''}
                    onChange={(e) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, branch: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="e.g., CSE, ECE, IT"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Roll Number / Registration Number</label>
                  <Input
                    value={addingMember.newMember.rollNumber || ''}
                    onChange={(e) => setAddingMember({
                      ...addingMember,
                      newMember: { ...addingMember.newMember, rollNumber: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Enter roll/registration number"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <Button
                  onClick={saveNewMember}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
                <Button
                  onClick={() => setAddingMember(null)}
                  variant="outline"
                  className="flex-1 border-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Details Modal */}
      {editingTeamDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setEditingTeamDetails(null)}
        >
          <div 
            className="bg-gray-900 border border-purple-500/50 rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-400">Edit Team Details</h3>
              <Button
                onClick={() => setEditingTeamDetails(null)}
                variant="ghost"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Team Name *</label>
                <Input
                  value={editingTeamDetails.teamName}
                  onChange={(e) => setEditingTeamDetails({
                    ...editingTeamDetails,
                    teamName: e.target.value
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event Type</label>
                <Select 
                  value={editingTeamDetails.eventType}
                  onValueChange={(value) => setEditingTeamDetails({
                    ...editingTeamDetails,
                    eventType: value as 'hackathon' | 'ctf'
                  })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="ctf">CTF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <Button
                  onClick={saveTeamDetails}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button
                  onClick={() => setEditingTeamDetails(null)}
                  variant="outline"
                  className="flex-1 border-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
        )}

        {/* Event Management Tab */}
        {activeTab === 'event-management' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <Card className="bg-gray-800/50 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by team name, member name, email, phone, transaction ID, venue, or lab..."
                    value={eventManagementSearch}
                    onChange={(e) => setEventManagementSearch(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700 text-white w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Event Management Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800/50 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Checked In</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {registrations.filter(r => r.checkedIn).length} / {registrations.filter(r => r.isValid !== false).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Venue Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {registrations.filter(r => r.initialVenue).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Lab Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {registrations.filter(r => r.finalLab).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Food Count (Lunch 6th)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {registrations.filter(r => r.foodTracking?.lunch6th).reduce((sum, r) => sum + r.teamMembers.length, 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Check-in Section */}
            <Card className="bg-gray-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl">Check-in Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-3 mb-4">
                    <Button
                      onClick={() => handleBulkCheckIn(registrations.filter(r => !r.checkedIn && r.isValid !== false).map(r => r.id))}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={registrations.filter(r => !r.checkedIn && r.isValid !== false).length === 0}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In All ({registrations.filter(r => !r.checkedIn && r.isValid !== false).length})
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {registrations
                      .filter(r => r.isValid !== false)
                      .filter(r => {
                        if (!eventManagementSearch) return true;
                        const search = eventManagementSearch.toLowerCase();
                        return (
                          r.teamName.toLowerCase().includes(search) ||
                          r.transactionId?.toLowerCase().includes(search) ||
                          r.id.toLowerCase().includes(search) ||
                          r.initialVenue?.toLowerCase().includes(search) ||
                          r.finalLab?.toLowerCase().includes(search) ||
                          r.teamMembers.some(m => 
                            m.name.toLowerCase().includes(search) ||
                            m.email.toLowerCase().includes(search) ||
                            m.phoneNumber.includes(search)
                          )
                        );
                      })
                      .map(reg => (
                      <div key={reg.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded">
                        <div className="flex-1">
                          <span className="font-medium">{reg.teamName}</span>
                          <span className="text-gray-400 ml-2">({reg.teamMembers.length} members)</span>
                          {reg.checkedIn && (
                            <Badge className="ml-2 bg-green-500/20 text-green-400">
                              ✓ Checked in {new Date(reg.checkedInAt!).toLocaleTimeString()}
                            </Badge>
                          )}
                        </div>
                        {!reg.checkedIn && (
                          <Button
                            onClick={() => handleCheckIn(reg.id)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Venue Assignment Section */}
            <Card className="bg-gray-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl">Initial Venue Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {!venueAssignmentMode ? (
                  <div>
                    <p className="text-gray-400 mb-4">
                      Assigned: {registrations.filter(r => r.initialVenue).length} / {registrations.filter(r => r.isValid !== false).length}
                    </p>
                    <Button
                      onClick={() => setVenueAssignmentMode(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={registrations.filter(r => r.isValid !== false && !r.initialVenue).length === 0}
                    >
                      Assign Venues
                    </Button>

                    {/* Venue Lists */}
                    <div className="grid md:grid-cols-3 gap-4 mt-6">
                      {['venue1', 'venue2', 'venue3'].map(venue => {
                        const venueTeams = registrations
                          .filter(r => r.initialVenue === venue)
                          .filter(r => {
                            if (!eventManagementSearch) return true;
                            const search = eventManagementSearch.toLowerCase();
                            return (
                              r.teamName.toLowerCase().includes(search) ||
                              r.transactionId?.toLowerCase().includes(search) ||
                              r.id.toLowerCase().includes(search) ||
                              r.teamMembers.some(m => 
                                m.name.toLowerCase().includes(search) ||
                                m.email.toLowerCase().includes(search) ||
                                m.phoneNumber.includes(search)
                              )
                            );
                          });
                        return (
                          <div key={venue} className="bg-gray-900/50 p-4 rounded-lg">
                            <h3 className="font-bold mb-2 text-purple-400">
                              Venue {venue.slice(-1)} ({venueTeams.length} teams)
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {venueTeams.map(reg => (
                                <div key={reg.id} className="text-sm bg-gray-800/50 p-2 rounded">
                                  <div className="flex items-center justify-between">
                                    <span>{reg.teamName}</span>
                                    <input
                                      type="checkbox"
                                      checked={reg.initialVenueAttendance || false}
                                      onChange={(e) => markVenueAttendance(reg.id, e.target.checked)}
                                      className="w-4 h-4"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm mb-2">Venue 1 Count</label>
                        <Input
                          type="number"
                          value={venue1Count}
                          onChange={(e) => setVenue1Count(parseInt(e.target.value) || 0)}
                          className="bg-gray-900/50 border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Venue 2 Count</label>
                        <Input
                          type="number"
                          value={venue2Count}
                          onChange={(e) => setVenue2Count(parseInt(e.target.value) || 0)}
                          className="bg-gray-900/50 border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-2">Venue 3 Count</label>
                        <Input
                          type="number"
                          value={venue3Count}
                          onChange={(e) => setVenue3Count(parseInt(e.target.value) || 0)}
                          className="bg-gray-900/50 border-gray-700"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      Total: {venue1Count + venue2Count + venue3Count} / {registrations.filter(r => r.isValid !== false && !r.initialVenue).length}
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={assignToVenues} className="bg-green-600 hover:bg-green-700">
                        Assign
                      </Button>
                      <Button onClick={() => setVenueAssignmentMode(false)} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lab Assignment Section */}
            <Card className="bg-gray-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl">Final Lab Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Auto Assignment for Hackathon */}
                  {!labAssignmentMode ? (
                    <div className="mb-6">
                      <p className="text-gray-400 mb-4">
                        Assigned: {registrations.filter(r => r.finalLab).length} / {registrations.filter(r => r.isValid !== false).length}
                      </p>
                      <Button
                        onClick={() => setLabAssignmentMode(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={registrations.filter(r => r.eventType === 'hackathon' && r.isValid !== false && !r.finalLab).length === 0}
                      >
                        Auto-Assign Hackathon Labs
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-6 space-y-4">
                      <p className="text-sm text-gray-400">
                        Hackathon teams to assign: {registrations.filter(r => r.eventType === 'hackathon' && r.isValid !== false && !r.finalLab).length}
                      </p>
                      <div className="grid md:grid-cols-3 gap-3">
                        {['hack-lab1', 'hack-lab2', 'hack-lab3', 'hack-lab4', 'hack-lab5', 'hack-lab6', 'hack-lab7', 'hack-lab8', 'hack-lab9'].map(lab => (
                          <div key={lab}>
                            <label className="block text-xs mb-1">{lab}</label>
                            <Input
                              type="number"
                              value={labCounts[lab] || 0}
                              onChange={(e) => setLabCounts({ ...labCounts, [lab]: parseInt(e.target.value) || 0 })}
                              className="bg-gray-900/50 border-gray-700 h-9"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm">
                        Total: {Object.values(labCounts).reduce((sum, count) => sum + count, 0)} / {registrations.filter(r => r.eventType === 'hackathon' && r.isValid !== false && !r.finalLab).length}
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={assignLabsAutomatically} className="bg-green-600 hover:bg-green-700">
                          Assign Labs
                        </Button>
                        <Button onClick={() => setLabAssignmentMode(false)} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Manual Lab Selection Grid */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {registrations
                      .filter(r => r.isValid !== false)
                      .filter(r => {
                        if (!eventManagementSearch) return true;
                        const search = eventManagementSearch.toLowerCase();
                        return (
                          r.teamName.toLowerCase().includes(search) ||
                          r.transactionId?.toLowerCase().includes(search) ||
                          r.id.toLowerCase().includes(search) ||
                          r.initialVenue?.toLowerCase().includes(search) ||
                          r.finalLab?.toLowerCase().includes(search) ||
                          r.teamMembers.some(m => 
                            m.name.toLowerCase().includes(search) ||
                            m.email.toLowerCase().includes(search) ||
                            m.phoneNumber.includes(search)
                          )
                        );
                      })
                      .map(reg => (
                      <div key={reg.id} className="bg-gray-900/50 p-3 rounded flex items-center gap-3">
                        <div className="flex-1">
                          <span className="font-medium">{reg.teamName}</span>
                          <span className="text-gray-400 ml-2">({reg.eventType.toUpperCase()})</span>
                          {reg.finalLab && (
                            <Badge className="ml-2 bg-purple-500/20 text-purple-300">
                              {reg.finalLab}
                            </Badge>
                          )}
                        </div>
                        <Select
                          value={reg.finalLab || ''}
                          onValueChange={(value) => assignToLab(reg.id, value)}
                        >
                          <SelectTrigger className="w-48 bg-gray-800 border-gray-700">
                            <SelectValue placeholder="Change lab..." />
                          </SelectTrigger>
                          <SelectContent>
                            {reg.eventType === 'ctf' ? (
                              <SelectItem value="ctf-lab">CTF Lab</SelectItem>
                            ) : (
                              <>
                                <SelectItem value="hack-lab1">Hackathon Lab 1</SelectItem>
                                <SelectItem value="hack-lab2">Hackathon Lab 2</SelectItem>
                                <SelectItem value="hack-lab3">Hackathon Lab 3</SelectItem>
                                <SelectItem value="hack-lab4">Hackathon Lab 4</SelectItem>
                                <SelectItem value="hack-lab5">Hackathon Lab 5</SelectItem>
                                <SelectItem value="hack-lab6">Hackathon Lab 6</SelectItem>
                                <SelectItem value="hack-lab7">Hackathon Lab 7</SelectItem>
                                <SelectItem value="hack-lab8">Hackathon Lab 8</SelectItem>
                                <SelectItem value="hack-lab9">Hackathon Lab 9</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <input
                          type="checkbox"
                          checked={reg.labAttendance || false}
                          onChange={(e) => markLabAttendance(reg.id, e.target.checked)}
                          className="w-5 h-5"
                          title="Lab Attendance"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Lab Counts Summary */}
                  <div className="grid md:grid-cols-5 gap-2 mt-6">
                    {['ctf-lab', 'hack-lab1', 'hack-lab2', 'hack-lab3', 'hack-lab4', 'hack-lab5', 'hack-lab6', 'hack-lab7', 'hack-lab8', 'hack-lab9'].map(lab => {
                      const labTeams = registrations.filter(r => r.finalLab === lab);
                      const attendance = labTeams.filter(r => r.labAttendance).length;
                      return (
                        <div key={lab} className="bg-gray-900/50 p-2 rounded text-center">
                          <div className="text-xs text-gray-400">{lab}</div>
                          <div className="text-lg font-bold">{labTeams.length}</div>
                          <div className="text-xs text-green-400">✓ {attendance}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Food Tracking Section */}
            <Card className="bg-gray-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl">Food Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Food Stats */}
                  <div className="grid md:grid-cols-4 gap-3 mb-6">
                    {[
                      { key: 'lunch6th', label: 'Lunch (6th)' },
                      { key: 'dinner6th', label: 'Dinner (6th)' },
                      { key: 'breakfast7th', label: 'Breakfast (7th)' },
                      { key: 'lunch7th', label: 'Lunch (7th)' }
                    ].map(meal => {
                      const count = registrations.filter(r => r.foodTracking?.[meal.key as keyof FoodTracking]).reduce((sum, r) => sum + r.teamMembers.length, 0);
                      return (
                        <div key={meal.key} className="bg-gray-900/50 p-3 rounded text-center">
                          <div className="text-sm text-gray-400">{meal.label}</div>
                          <div className="text-2xl font-bold text-green-400">{count}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Food Tracking Grid */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {registrations
                      .filter(r => r.isValid !== false)
                      .filter(r => {
                        if (!eventManagementSearch) return true;
                        const search = eventManagementSearch.toLowerCase();
                        return (
                          r.teamName.toLowerCase().includes(search) ||
                          r.transactionId?.toLowerCase().includes(search) ||
                          r.id.toLowerCase().includes(search) ||
                          r.initialVenue?.toLowerCase().includes(search) ||
                          r.finalLab?.toLowerCase().includes(search) ||
                          r.teamMembers.some(m => 
                            m.name.toLowerCase().includes(search) ||
                            m.email.toLowerCase().includes(search) ||
                            m.phoneNumber.includes(search)
                          )
                        );
                      })
                      .map(reg => (
                      <div key={reg.id} className="bg-gray-900/50 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{reg.teamName}</span>
                          <span className="text-gray-400">({reg.teamMembers.length} members)</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { key: 'lunch6th', label: 'L-6th' },
                            { key: 'dinner6th', label: 'D-6th' },
                            { key: 'breakfast7th', label: 'B-7th' },
                            { key: 'lunch7th', label: 'L-7th' }
                          ].map(meal => (
                            <button
                              key={meal.key}
                              onClick={() => toggleFood(reg.id, meal.key as keyof FoodTracking)}
                              className={`p-2 rounded text-sm transition-all ${
                                reg.foodTracking?.[meal.key as keyof FoodTracking]
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              {meal.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kit Distribution Section */}
            <Card className="bg-gray-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl">Kit Distribution Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Kit Stats */}
                  <div className="grid md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-900/50 p-3 rounded text-center">
                      <div className="text-sm text-gray-400">Welcome Kits</div>
                      <div className="text-2xl font-bold text-green-400">
                        {registrations.filter(r => r.welcomeKitReceived).length} / {registrations.filter(r => r.isValid !== false).length}
                      </div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded text-center">
                      <div className="text-sm text-gray-400">T-Shirts</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {registrations.filter(r => r.tshirtsDistributed).length} / {registrations.filter(r => r.isValid !== false).length}
                      </div>
                    </div>
                    <div className="bg-gray-900/50 p-3 rounded text-center">
                      <div className="text-sm text-gray-400">ID Cards</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {registrations.filter(r => r.idCardDistributed).length} / {registrations.filter(r => r.isValid !== false).length}
                      </div>
                    </div>
                  </div>

                  {/* Kit Distribution Grid */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {registrations
                      .filter(r => r.isValid !== false)
                      .filter(r => {
                        if (!eventManagementSearch) return true;
                        const search = eventManagementSearch.toLowerCase();
                        return (
                          r.teamName.toLowerCase().includes(search) ||
                          r.transactionId?.toLowerCase().includes(search) ||
                          r.id.toLowerCase().includes(search) ||
                          r.initialVenue?.toLowerCase().includes(search) ||
                          r.finalLab?.toLowerCase().includes(search) ||
                          r.teamMembers.some(m => 
                            m.name.toLowerCase().includes(search) ||
                            m.email.toLowerCase().includes(search) ||
                            m.phoneNumber.includes(search)
                          )
                        );
                      })
                      .map(reg => (
                      <div key={reg.id} className="bg-gray-900/50 p-4 rounded">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <span className="font-medium text-lg">{reg.teamName}</span>
                            <span className="text-gray-400 ml-2">({reg.teamMembers.length} members)</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleKit(reg.id, 'welcomeKitReceived')}
                              className={`px-3 py-1 rounded text-sm ${
                                reg.welcomeKitReceived ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              Welcome Kit
                            </button>
                            <button
                              onClick={() => toggleKit(reg.id, 'tshirtsDistributed')}
                              className={`px-3 py-1 rounded text-sm ${
                                reg.tshirtsDistributed ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              T-Shirts
                            </button>
                            <button
                              onClick={() => toggleKit(reg.id, 'idCardDistributed')}
                              className={`px-3 py-1 rounded text-sm ${
                                reg.idCardDistributed ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              ID Card
                            </button>
                          </div>
                        </div>

                        {/* T-Shirt Sizes for each member */}
                        <div className="space-y-2">
                          {reg.teamMembers.map((member, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm bg-gray-800/50 p-2 rounded">
                              <span className="flex-1">{member.name}</span>
                              <Select
                                value={member.tshirtSize || ''}
                                onValueChange={(value) => updateTshirtSize(reg.id, idx, value)}
                              >
                                <SelectTrigger className="w-24 h-8 bg-gray-700 border-gray-600 text-xs">
                                  <SelectValue placeholder="Size" />
                                </SelectTrigger>
                                <SelectContent>
                                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => setEmergencyContact(reg.id, idx)}
                                className={`px-2 py-1 rounded text-xs ${
                                  member.isEmergencyContact ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'
                                }`}
                                title="Emergency Contact"
                              >
                                {member.isEmergencyContact ? '🚨 Emergency' : 'Set Emergency'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Movement & Remarks Section */}
            <Card className="bg-gray-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl">Movement Tracking & Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {registrations
                    .filter(r => r.isValid !== false)
                    .filter(r => {
                      if (!eventManagementSearch) return true;
                      const search = eventManagementSearch.toLowerCase();
                      return (
                        r.teamName.toLowerCase().includes(search) ||
                        r.transactionId?.toLowerCase().includes(search) ||
                        r.id.toLowerCase().includes(search) ||
                        r.initialVenue?.toLowerCase().includes(search) ||
                        r.finalLab?.toLowerCase().includes(search) ||
                        r.teamMembers.some(m => 
                          m.name.toLowerCase().includes(search) ||
                          m.email.toLowerCase().includes(search) ||
                          m.phoneNumber.includes(search)
                        )
                      );
                    })
                    .map(reg => (
                    <div key={reg.id} className="bg-gray-900/50 p-4 rounded">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-lg">{reg.teamName}</span>
                      </div>

                      {/* Movement Buttons */}
                      <div className="flex gap-2 mb-3">
                        <Button
                          onClick={() => {
                            const notes = prompt('Notes (optional):');
                            addMovement(reg.id, 'resting', notes || undefined);
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Resting
                        </Button>
                        <Button
                          onClick={() => {
                            const notes = prompt('Notes (optional):');
                            addMovement(reg.id, 'canteen', notes || undefined);
                          }}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Canteen
                        </Button>
                        <Button
                          onClick={() => {
                            const notes = prompt('Where/Why:');
                            if (notes) addMovement(reg.id, 'other', notes);
                          }}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Other
                        </Button>
                      </div>

                      {/* Movement History */}
                      {reg.movements && reg.movements.length > 0 && (
                        <div className="mb-3 p-2 bg-gray-800 rounded">
                          <div className="text-xs text-gray-400 mb-1">Recent Movements:</div>
                          <div className="space-y-1">
                            {reg.movements.slice(-3).reverse().map((mov, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="text-purple-400">{new Date(mov.timestamp).toLocaleTimeString()}</span>
                                {' - '}
                                <span className="text-gray-300">{mov.type}</span>
                                {mov.notes && <span className="text-gray-500"> ({mov.notes})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Remarks */}
                      <div>
                        <textarea
                          value={reg.remarks || ''}
                          onChange={(e) => updateRemarks(reg.id, e.target.value)}
                          placeholder="Add remarks..."
                          className="w-full bg-gray-800 border-gray-700 rounded p-2 text-sm"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
