import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

interface CSVRow {
  [key: string]: string;
}

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
  eventType: 'hackathon' | 'ctf';
  teamSize: number;
  teamName: string;
  teamMembers: TeamMember[];
  price: number;
  transactionId: string;
  paymentScreenshot: string;
  paymentScreenshotName: string;
  timestamp: string;
  confirmationSent: boolean;
  isValid: boolean;
}

// Parse CSV text to array of objects
export const parseCSV = (csvText: string): CSVRow[] => {
  // Handle different line endings (\r\n, \n, \r)
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    console.warn('CSV has less than 2 lines:', lines.length);
    return [];
  }

  // Parse headers using the same function to handle quotes
  const headers = parseCSVLine(lines[0]);
  console.log(`CSV Headers (${headers.length}):`, headers.slice(0, 5));
  
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length === headers.length) {
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      rows.push(row);
    } else {
      console.warn(`Row ${i + 1}: Column count mismatch. Expected ${headers.length}, got ${values.length}`);
    }
  }

  console.log(`Parsed ${rows.length} rows from CSV`);
  return rows;
};

// Handle CSV parsing with quoted values
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && inQuotes && nextChar === '"') {
      // Handle escaped quotes ("")
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Map CSV row to TeamMember
const mapTeamMember = (row: CSVRow, memberIndex: number): TeamMember | null => {
  const nameKey = memberIndex === 1 
    ? 'Full Name (Member 1)' 
    : `Full Name (Member ${memberIndex})`;
  
  const emailKey = memberIndex === 1
    ? 'Email Address (Member 1)'
    : `Email Address (Member ${memberIndex})`;

  const phoneKey = memberIndex === 1
    ? 'Phone Number (Member 1) (10-digit number)'
    : `Phone Number (Member ${memberIndex}) (10-digit number)`;

  const collegeKey = memberIndex === 1
    ? 'College/Institution (Member 1)'
    : `College/Institution (Member ${memberIndex})`;

  const degreeKey = memberIndex === 1
    ? 'Degree Type (Member 1)'
    : `Degree Type (Member ${memberIndex})`;

  const yearKey = memberIndex === 1
    ? 'Year of Study (Member 1)'
    : `Year of Study (Member ${memberIndex})`;

  const branchKey = memberIndex === 1
    ? 'Branch/Department (Member 1)'
    : `Branch/Department (Member ${memberIndex})`;

  const rollKey = memberIndex === 1
    ? 'Roll Number / Registration Number (Member 1)'
    : `Roll Number / Registration Number (Member ${memberIndex})`;

  const name = row[nameKey]?.trim();
  const email = row[emailKey]?.trim();
  
  // Skip if member doesn't exist (name or email is empty/None)
  if (!name || !email || name === 'None' || email === 'None' || name === '' || email === '') {
    return null;
  }

  // Validate email format (basic check) but still import
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const hasValidEmail = emailRegex.test(email);
  if (!hasValidEmail) {
    console.warn(`Invalid email format for ${name}: ${email} - importing anyway`);
  }

  const college = row[collegeKey] || '';
  const isCBIT = college.includes('CBIT') || college.includes('Chaitanya Bharathi');
  
  const degreeType = row[degreeKey] || 'B.Tech';
  const branch = row[branchKey] || '';
  const phoneRaw = row[phoneKey] || '';
  
  // Clean phone number - remove +91, spaces, hyphens
  const phoneNumber = phoneRaw
    .replace(/^\+91\s*/, '')
    .replace(/[\s-]/g, '')
    .trim();

  return {
    name,
    email,
    phoneNumber,
    college: isCBIT ? 'CBIT' : college,
    collegeType: isCBIT ? 'CBIT' : 'Other',
    customCollege: isCBIT ? '' : college,
    degreeType: ['B.Tech', 'B.E', 'M.Tech', 'MCA', 'BCA'].includes(degreeType) ? degreeType : 'Other',
    customDegree: ['B.Tech', 'B.E', 'M.Tech', 'MCA', 'BCA'].includes(degreeType) ? '' : degreeType,
    degree: degreeType,
    yearOfStudy: row[yearKey] || '',
    branch: branch,
    branchType: 'Listed',
    customBranch: '',
    rollNumber: row[rollKey] || '',
  };
};

// Convert CSV row to Registration object
export const mapCSVToRegistration = (row: CSVRow): Registration | null => {
  const eventTypeRaw = row['Select Event Type'] || '';
  let eventType: 'hackathon' | 'ctf' = 'hackathon';
  
  if (eventTypeRaw.includes('CTF')) {
    eventType = 'ctf';
  } else if (eventTypeRaw.includes('Hackathon')) {
    eventType = 'hackathon';
  }

  const teamName = row['Team Name (Minimum 3 characters)'] || 'Unnamed Team';
  const teamSizeRaw = row['Team Size'] || '1';
  
  // Parse team size from the text
  let teamSize = 1;
  if (teamSizeRaw.includes('1') || teamSizeRaw.toLowerCase().includes('solo')) {
    teamSize = 1;
  } else if (teamSizeRaw.includes('2')) {
    teamSize = 2;
  } else if (teamSizeRaw.includes('3')) {
    teamSize = 3;
  } else if (teamSizeRaw.includes('4')) {
    teamSize = 4;
  }

  // Collect team members
  const teamMembers: TeamMember[] = [];
  for (let i = 1; i <= 4; i++) {
    const member = mapTeamMember(row, i);
    if (member) {
      teamMembers.push(member);
    }
  }

  if (teamMembers.length === 0) {
    console.warn('No valid team members found for:', teamName);
    return null;
  }

  // Parse price from payment amount field
  const priceRaw = row['Payment Amount (Solo: ₹300, 2 members: ₹600, 3 members: ₹900, 4 members: ₹1200)'] || '';
  let price = 300;
  
  // Try to extract number from the text
  const priceMatch = priceRaw.match(/\d+/);
  if (priceMatch) {
    const extractedPrice = parseInt(priceMatch[0]);
    // Validate it's a reasonable price
    if ([300, 600, 900, 1200].includes(extractedPrice)) {
      price = extractedPrice;
    } else {
      // Calculate based on team size if price is invalid
      price = teamMembers.length * 300;
    }
  } else {
    // No valid price found, calculate from team size
    price = teamMembers.length * 300;
  }

  // Transaction ID - generate temporary unique ID if empty to avoid duplicate conflicts
  let transactionId = row['UPI Transaction ID (Minimum 10 characters)']?.trim() || '';
  
  // Validate transaction ID
  if (!transactionId || transactionId.length < 10) {
    console.warn(`Invalid or missing transaction ID for team: ${teamName}`);
    // Generate temporary unique ID if empty to avoid duplicate conflicts
    if (!transactionId) {
      transactionId = `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn(`Generated temporary ID: ${transactionId}`);
    }
  }
  
  const paymentScreenshot = row['Payment Screenshot (Only Images, Max 5MB)'] || '';
  const timestamp = row['Timestamp'] || new Date().toISOString();

  // Convert timestamp to ISO format
  let isoTimestamp = timestamp;
  try {
    // Google Forms format: "2/3/2026 23:46:41"
    const dateParts = timestamp.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/);
    if (dateParts) {
      const [_, month, day, year, hour, minute, second] = dateParts;
      isoTimestamp = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}`).toISOString();
    }
  } catch (e) {
    console.warn('Could not parse timestamp:', timestamp);
  }

  return {
    eventType,
    teamSize: teamMembers.length,
    teamName,
    teamMembers,
    price,
    transactionId,
    paymentScreenshot,
    paymentScreenshotName: paymentScreenshot ? `screenshot_${teamName}.jpg` : '',
    timestamp: isoTimestamp,
    confirmationSent: false,
    isValid: true,
  };
};

// Import registrations from CSV file
export const importCSVToFirebase = async (csvFile: File): Promise<{ success: number; failed: number; errors: string[] }> => {
  const text = await csvFile.text();
  const rows = parseCSV(text);
  
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(`Processing ${rows.length} rows from CSV...`);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 because: +1 for header, +1 for 0-index
    
    try {
      const registration = mapCSVToRegistration(row);
      if (!registration) {
        failed++;
        const teamName = row['Team Name (Minimum 3 characters)'] || 'Unknown';
        errors.push(`Row ${rowNumber}: ${teamName} - No valid team members found`);
        continue;
      }

      // Collect warnings but still import
      const rowWarnings = [];
      if (!registration.transactionId || registration.transactionId.length < 10) {
        rowWarnings.push('short/missing transaction ID');
      }
      
      // Check emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      registration.teamMembers.forEach((member, idx) => {
        if (!emailRegex.test(member.email)) {
          rowWarnings.push(`member ${idx + 1} invalid email`);
        }
      });

      // Check if registration already exists (by transaction ID)
      const q = query(
        collection(db, 'registrations'),
        where('transactionId', '==', registration.transactionId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Add new registration
        await addDoc(collection(db, 'registrations'), registration);
        success++;
        
        if (rowWarnings.length > 0) {
          warnings.push(`Row ${rowNumber}: ${registration.teamName} - ${rowWarnings.join(', ')}`);
        }
        
        console.log(`✓ Imported: ${registration.teamName} (${registration.teamMembers.length} members)${rowWarnings.length > 0 ? ' with warnings' : ''}`);
      } else {
        // Skip duplicate
        errors.push(`Row ${rowNumber}: ${registration.teamName} - Duplicate transaction ID`);
        failed++;
      }
    } catch (error) {
      failed++;
      const teamName = row['Team Name (Minimum 3 characters)'] || 'Unknown';
      errors.push(`Row ${rowNumber}: ${teamName} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Import error:', error);
    }
  }

  console.log(`Import complete: ${success} success, ${failed} failed, ${warnings.length} warnings`);
  
  // Combine errors and warnings for reporting
  const allIssues = [...errors, ...warnings];
  return { success, failed, errors: allIssues };
};
