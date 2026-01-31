import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Search, Users, Calendar, LogOut, Mail, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';

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
}

const Admin = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'hackathon' | 'ctf'>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);

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

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      (reg.teamName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reg.teamMembers || []).some(member => 
        (member.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phoneNumber || '').includes(searchTerm)
      );
    
    const matchesFilter = eventFilter === 'all' || reg.eventType === eventFilter;
    
    return matchesSearch && matchesFilter;
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

  const viewPaymentScreenshot = (registration: Registration) => {
    setSelectedRegistration(registration);
  };

  const getTotalRevenue = () => {
    return filteredRegistrations.reduce((sum, reg) => sum + reg.price, 0);
  };

  const getTotalParticipants = () => {
    return filteredRegistrations.reduce((sum, reg) => sum + reg.teamMembers.length, 0);
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
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

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
              <div className="text-2xl font-bold text-purple-400">{getTotalParticipants()}</div>
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
            <div className="flex flex-col md:flex-row gap-4">
              {/* Refresh Button */}
              <Button 
                onClick={fetchRegistrations}
                disabled={loading || refreshCooldown > 0}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={refreshCooldown > 0 ? `Available in ${Math.floor(refreshCooldown / 60)}:${String(refreshCooldown % 60).padStart(2, '0')}` : 'Refresh data'}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading 
                  ? 'Loading...' 
                  : refreshCooldown > 0 
                    ? `Wait ${Math.floor(refreshCooldown / 60)}:${String(refreshCooldown % 60).padStart(2, '0')}`
                    : 'Refresh Data'}
              </Button>

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by team name, email, phone, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                />
              </div>

              {/* Filter */}
              <Select value={eventFilter} onValueChange={(value: any) => setEventFilter(value)}>
                <SelectTrigger className="w-[180px] bg-gray-900/50 border-gray-700 text-white">
                  <SelectValue placeholder="Filter by event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="ctf">CTF</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button 
                onClick={exportToExcel}
                variant="outline"
                disabled={filteredRegistrations.length === 0}
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
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
                        <Badge variant={registration.eventType === 'hackathon' ? 'default' : 'secondary'}>
                          {registration.eventType.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">
                          ₹{registration.price}
                        </Badge>
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
                        <p className="text-xs text-gray-500 mb-2">Transaction ID: {registration.transactionId}</p>
                        <div className="space-y-2">
                          {registration.teamMembers.map((member, idx) => (
                            <div key={idx} className="text-sm bg-gray-900/50 p-3 rounded-lg">
                              <div className="font-semibold text-purple-400 mb-1">Member {idx + 1}: {member.name}</div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-400">
                                <div>📧 {member.email}</div>
                                <div>📱 {member.phoneNumber}</div>
                                <div>🎓 {member.collegeType === 'CBIT' ? 'CBIT' : member.customCollege}</div>
                                <div>📚 {member.degreeType === 'Other' ? member.customDegree : member.degreeType} - Year {member.yearOfStudy}</div>
                                <div>💼 {member.branch === 'Other' ? member.customBranch : member.branch}</div>
                                <div>🆔 {member.rollNumber}</div>
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
      </div>

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
    </div>
  );
};

export default Admin;
