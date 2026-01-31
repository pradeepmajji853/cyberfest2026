import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Flag, ChevronRight, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import qrPayment from '@/assets/qrpayment.jpeg';

interface RegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type EventType = 'hackathon' | 'ctf' | null;
type Step = 'event-selection' | 'team-size' | 'details' | 'payment' | 'success';

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

const BRANCHES = [
  { value: 'AIDS', label: 'AIDS (Artificial Intelligence & Data Science)' },
  { value: 'AIML', label: 'AIML (Artificial Intelligence & Machine Learning)' },
  { value: 'Bio-Tech', label: 'Bio-Technology' },
  { value: 'Chemical', label: 'Chemical Engineering' },
  { value: 'Civil', label: 'Civil Engineering' },
  { value: 'CSE', label: 'CSE (Computer Science & Engineering)' },
  { value: 'CSE-AIML', label: 'CSE - AIML (Computer Science & AIML)' },
  { value: 'ECE', label: 'ECE (Electronics & Communication Engineering)' },
  { value: 'ECE-EVL', label: 'ECE - EVL (Electronics, VLSI & Embedded Systems)' },
  { value: 'EEE', label: 'EEE (Electrical & Electronics Engineering)' },
  { value: 'IT', label: 'IT (Information Technology)' },
  { value: 'IoT', label: 'IoT (Internet of Things)' },
  { value: 'Mechanical', label: 'Mechanical Engineering' },
  { value: 'Other', label: 'Other' },
];

const RegistrationDialog = ({ isOpen, onClose }: RegistrationDialogProps) => {
  const [step, setStep] = useState<Step>('event-selection');
  const [eventType, setEventType] = useState<EventType>(null);
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPrice = () => {
    if (!eventType || !teamSize) return 0;
    if (eventType === 'hackathon') {
      if (teamSize === 1) return 300;
      if (teamSize === 2) return 600;
      if (teamSize === 3) return 900;
      return 1200; // teamSize === 4
    } else {
      return teamSize === 1 ? 300 : 600;
    }
  };

  const initializeTeamMembers = (size: number) => {
    const members: TeamMember[] = Array(size)
      .fill(null)
      .map(() => ({
        name: '',
        college: 'CBIT',
        collegeType: 'CBIT',
        customCollege: '',
        degreeType: 'B.Tech',
        customDegree: '',
        degree: 'B.Tech',
        yearOfStudy: '',
        branch: '',
        branchType: 'Listed',
        customBranch: '',
        rollNumber: '',
        email: '',
        phoneNumber: '',
      }));
    setTeamMembers(members);
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateDetails = () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    return teamName.trim() !== '' && teamMembers.every(
      (member) =>
        member.name &&
        member.email &&
        isValidEmail(member.email) &&
        member.phoneNumber &&
        member.rollNumber &&
        member.yearOfStudy &&
        (member.collegeType === 'CBIT' || member.customCollege) &&
        (member.degreeType !== 'Other' || member.customDegree) &&
        (member.branch && (member.branch !== 'Other' || member.customBranch))
    );
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
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions to reduce file size
          const maxDimension = 1200;
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
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Start with quality 0.8 and reduce if needed
          let quality = 0.8;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          // Keep reducing quality until size is under limit
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

  const handleSubmit = async () => {
    if (!paymentScreenshot || !transactionId) {
      alert('Please upload payment screenshot and enter transaction ID');
      return;
    }

    setIsSubmitting(true);
    try {
      // Compress and convert image to base64
      const base64Image = await compressImage(paymentScreenshot, 400);

      // Check final size (base64 adds ~37% overhead)
      const sizeInKB = (base64Image.length * 0.75) / 1024;
      if (sizeInKB > 500) {
        alert('Image is too large even after compression. Please compress your image using https://imagecompressor.com/ and try again.');
        setIsSubmitting(false);
        return;
      }

      // Save to Firestore
      await addDoc(collection(db, 'registrations'), {
        eventType,
        teamSize,
        teamName,
        teamMembers,
        price: getPrice(),
        transactionId,
        paymentScreenshot: base64Image,
        paymentScreenshotName: paymentScreenshot.name,
        timestamp: new Date().toISOString(),
      });

      setStep('success');
    } catch (error) {
      console.error('Error submitting registration:', error);
      alert('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setStep('event-selection');
    setEventType(null);
    setTeamSize(null);
    setTeamName('');
    setTeamMembers([]);
    setPaymentScreenshot(null);
    setTransactionId('');
    onClose();
  };

  // Prevent body scroll when dialog is open and ensure dialog is visible
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl h-[100svh] sm:h-auto max-h-[100svh] sm:max-h-[90vh] overflow-y-auto bg-background border-0 sm:border-2 border-primary/30 rounded-none sm:rounded-lg shadow-[0_0_30px_rgba(0,71,171,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-primary/30 p-4 sm:p-6">
            <div className="flex items-center justify-between pr-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-orbitron font-bold text-primary">
                Registration - CyberFest 2026
              </h2>
            </div>
          </div>
          <button
            onClick={resetDialog}
            className="fixed top-3 right-3 z-20 p-2 bg-background/90 border border-primary/30 hover:bg-primary/10 rounded-lg transition-colors sm:absolute sm:top-4 sm:right-4"
            aria-label="Close registration"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {step === 'event-selection' && (
              <EventSelection
                onSelect={(type) => {
                  setEventType(type);
                  setStep('team-size');
                }}
              />
            )}

            {step === 'team-size' && eventType && (
              <TeamSizeSelection
                eventType={eventType}
                onSelect={(size) => {
                  setTeamSize(size);
                  initializeTeamMembers(size);
                  setStep('details');
                }}
                onBack={() => setStep('event-selection')}
              />
            )}

            {step === 'details' && (
              <DetailsForm
                teamName={teamName}
                setTeamName={setTeamName}
                teamMembers={teamMembers}
                setTeamMembers={setTeamMembers}
                updateTeamMember={updateTeamMember}
                onNext={() => setStep('payment')}
                onBack={() => setStep('team-size')}
                validateDetails={validateDetails}
              />
            )}

            {step === 'payment' && (
              <PaymentStep
                price={getPrice()}
                eventType={eventType!}
                teamSize={teamSize!}
                paymentScreenshot={paymentScreenshot}
                setPaymentScreenshot={setPaymentScreenshot}
                transactionId={transactionId}
                setTransactionId={setTransactionId}
                onSubmit={handleSubmit}
                onBack={() => setStep('details')}
                isSubmitting={isSubmitting}
              />
            )}

            {step === 'success' && (
              <SuccessMessage onClose={resetDialog} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Event Selection Component
const EventSelection = ({ onSelect }: { onSelect: (type: EventType) => void }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-orbitron font-bold text-foreground mb-2">
          Choose Your Event
        </h3>
        <p className="text-foreground/60">Select which event you want to register for</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Hackathon Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('hackathon')}
          className="group relative p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/30 rounded-lg hover:border-primary transition-all"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
          <Users className="w-12 h-12 text-primary mb-4 mx-auto" />
          <h4 className="text-2xl font-orbitron font-bold text-primary mb-3">Hackathon</h4>
          <div className="space-y-2 text-foreground/80">
            <p className="flex items-center justify-center gap-2">
              <span className="text-primary font-bold">₹300</span> - Solo
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="text-primary font-bold">₹600</span> - Team of 2
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="text-primary font-bold">₹900</span> - Team of 3
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="text-primary font-bold">₹1200</span> - Team of 4
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-primary mx-auto mt-4 group-hover:translate-x-2 transition-transform" />
        </motion.button>

        {/* CTF Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('ctf')}
          className="group relative p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/30 rounded-lg hover:border-primary transition-all"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
          <Flag className="w-12 h-12 text-primary mb-4 mx-auto" />
          <h4 className="text-2xl font-orbitron font-bold text-primary mb-3">
            Capture The Flag
          </h4>
          <div className="space-y-2 text-foreground/80">
            <p className="flex items-center justify-center gap-2">
              <span className="text-primary font-bold">₹300</span> - Solo
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="text-primary font-bold">₹600</span> - Team of 2
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-primary mx-auto mt-4 group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
};

// Team Size Selection Component
const TeamSizeSelection = ({
  eventType,
  onSelect,
  onBack,
}: {
  eventType: EventType;
  onSelect: (size: number) => void;
  onBack: () => void;
}) => {
  const options =
    eventType === 'hackathon'
      ? [
          { size: 1, price: 300, label: 'Solo' },
          { size: 2, price: 600, label: 'Team of 2' },
          { size: 3, price: 900, label: 'Team of 3' },
          { size: 4, price: 1200, label: 'Team of 4' },
        ]
      : [
          { size: 1, price: 300, label: 'Solo' },
          { size: 2, price: 600, label: 'Team of 2' },
        ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-orbitron font-bold text-foreground mb-2">
          Select Team Size
        </h3>
        <p className="text-foreground/60">
          Choose how many members will be in your team
        </p>
      </div>

      {eventType === 'hackathon' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-400 text-sm text-center">
            <strong>Note:</strong> Teams with 1 or 2 members will be merged with other small teams during the event to ensure optimal collaboration.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {options.map((option) => (
          <motion.button
            key={option.size}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.size)}
            className="group relative p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/30 rounded-lg hover:border-primary transition-all"
          >
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
            <Users className="w-12 h-12 text-primary mb-4 mx-auto" />
            <h4 className="text-2xl font-orbitron font-bold text-primary mb-3">
              {'label' in option ? option.label : `Team of ${option.size}`}
            </h4>
            <p className="text-3xl font-bold text-primary">₹{option.price}</p>
            <ChevronRight className="w-6 h-6 text-primary mx-auto mt-4 group-hover:translate-x-2 transition-transform" />
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
};

// Details Form Component
const DetailsForm = ({
  teamName,
  setTeamName,
  teamMembers,
  setTeamMembers,
  updateTeamMember,
  onNext,
  onBack,
  validateDetails,
}: {
  teamName: string;
  setTeamName: (name: string) => void;
  teamMembers: TeamMember[];
  setTeamMembers: (members: TeamMember[]) => void;
  updateTeamMember: (index: number, field: keyof TeamMember, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  validateDetails: () => boolean;
}) => {
  const [errors, setErrors] = useState<{
    teamName?: string;
    members: Array<{ email?: string; phoneNumber?: string; rollNumber?: string }>;
  }>({
    members: teamMembers.map(() => ({})),
  });

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      members: teamMembers.map((_, index) => prev.members[index] || {}),
    }));
  }, [teamMembers.length]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{10}$/.test(phone.replace(/\D/g, ''));

  const setMemberError = (
    index: number,
    field: 'email' | 'phoneNumber' | 'rollNumber',
    message?: string,
  ) => {
    setErrors((prev) => ({
      ...prev,
      members: prev.members.map((memberErrors, i) =>
        i === index ? { ...memberErrors, [field]: message } : memberErrors,
      ),
    }));
  };

  const handleNext = () => {
    const normalizedEmails = teamMembers.map((m) => m.email.trim().toLowerCase()).filter(Boolean);
    const normalizedPhones = teamMembers
      .map((m) => m.phoneNumber.replace(/\D/g, ''))
      .filter(Boolean);
    const normalizedRolls = teamMembers.map((m) => m.rollNumber.trim().toLowerCase()).filter(Boolean);

    const nextErrors = {
      teamName: teamName.trim() ? undefined : 'Team name is required.',
      members: teamMembers.map((member, index) => {
        const email = member.email.trim().toLowerCase();
        const phone = member.phoneNumber.replace(/\D/g, '');
        const roll = member.rollNumber.trim().toLowerCase();

        const emailDuplicate = email && normalizedEmails.filter((e) => e === email).length > 1;
        const phoneDuplicate = phone && normalizedPhones.filter((p) => p === phone).length > 1;
        const rollDuplicate = roll && normalizedRolls.filter((r) => r === roll).length > 1;

        return {
          email:
            email && validateEmail(email)
              ? emailDuplicate
                ? 'Email must be unique for each member.'
                : undefined
              : 'Enter a valid email address.',
          phoneNumber:
            phone && validatePhone(phone)
              ? phoneDuplicate
                ? 'Phone number must be unique for each member.'
                : undefined
              : 'Enter a valid 10-digit phone number.',
          rollNumber: rollDuplicate ? 'Roll number must be unique for each member.' : undefined,
        };
      }),
    };

    setErrors(nextErrors);

    const hasErrors =
      Boolean(nextErrors.teamName) ||
      nextErrors.members.some((m) => m.email || m.phoneNumber || m.rollNumber);
    if (!hasErrors && validateDetails()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-orbitron font-bold text-foreground mb-2">
          Team Member Details
        </h3>
        <p className="text-foreground/60">Fill in the details for each team member</p>
      </div>

      {/* Team Name Field */}
      <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-2 border-primary/30 rounded-lg">
        <label className="block text-sm font-medium text-foreground mb-2">
          Team Name *
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 text-foreground ${
            errors.teamName ? 'border-red-500/60 focus:ring-red-500/20' : 'border-primary/30 focus:border-primary focus:ring-primary/20'
          }`}
          placeholder="Enter your team name"
        />
        {errors.teamName && (
          <p className="mt-2 text-sm text-red-400">{errors.teamName}</p>
        )}
      </div>

      {teamMembers.map((member, index) => (
        <div
          key={index}
          className="p-6 bg-primary/5 border border-primary/30 rounded-lg space-y-4"
        >
          <h4 className="text-lg font-orbitron font-bold text-primary mb-4">
            Member {index + 1}
          </h4>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={member.name}
                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email *
              </label>
              <input
                type="email"
                value={member.email}
                onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  setMemberError(index, 'email', value && validateEmail(value) ? undefined : 'Enter a valid email address.');
                }}
                className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 text-foreground ${
                  errors.members[index]?.email
                    ? 'border-red-500/60 focus:ring-red-500/20'
                    : 'border-primary/30 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder="Enter email"
              />
              {errors.members[index]?.email && (
                <p className="mt-2 text-sm text-red-400">{errors.members[index]?.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={member.phoneNumber}
                onChange={(e) => updateTeamMember(index, 'phoneNumber', e.target.value)}
                onBlur={(e) => {
                  const value = e.target.value;
                  setMemberError(
                    index,
                    'phoneNumber',
                    value && validatePhone(value) ? undefined : 'Enter a valid 10-digit phone number.',
                  );
                }}
                className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 text-foreground ${
                  errors.members[index]?.phoneNumber
                    ? 'border-red-500/60 focus:ring-red-500/20'
                    : 'border-primary/30 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder="Enter phone number"
              />
              {errors.members[index]?.phoneNumber && (
                <p className="mt-2 text-sm text-red-400">{errors.members[index]?.phoneNumber}</p>
              )}
            </div>

            {/* Roll Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Roll Number *
              </label>
              <input
                type="text"
                value={member.rollNumber}
                onChange={(e) => updateTeamMember(index, 'rollNumber', e.target.value)}
                onBlur={() => {
                  const roll = member.rollNumber.trim().toLowerCase();
                  const duplicates = teamMembers
                    .map((m) => m.rollNumber.trim().toLowerCase())
                    .filter(Boolean)
                    .filter((r) => r === roll).length;
                  setMemberError(
                    index,
                    'rollNumber',
                    roll && duplicates > 1 ? 'Roll number must be unique for each member.' : undefined,
                  );
                }}
                className={`w-full px-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 text-foreground ${
                  errors.members[index]?.rollNumber
                    ? 'border-red-500/60 focus:ring-red-500/20'
                    : 'border-primary/30 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder="Enter roll number"
              />
              {errors.members[index]?.rollNumber && (
                <p className="mt-2 text-sm text-red-400">{errors.members[index]?.rollNumber}</p>
              )}
            </div>

            {/* College Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                College *
              </label>
              <select
                value={member.collegeType}
                onChange={(e) => {
                  const newCollegeType = e.target.value;
                  setTeamMembers((prev) =>
                    prev.map((member, i) =>
                      i === index
                        ? {
                            ...member,
                            collegeType: newCollegeType,
                            college: newCollegeType === 'CBIT' ? 'CBIT' : '',
                            customCollege: newCollegeType === 'CBIT' ? '' : member.customCollege,
                          }
                        : member,
                    ),
                  );
                }}
                className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              >
                <option value="CBIT">CBIT</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Custom College */}
            {member.collegeType === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  College Name *
                </label>
                <input
                  type="text"
                  value={member.customCollege}
                  onChange={(e) => {
                    updateTeamMember(index, 'customCollege', e.target.value);
                    updateTeamMember(index, 'college', e.target.value);
                  }}
                  className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  placeholder="Enter college name"
                />
              </div>
            )}

            {/* Degree Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Degree Type *
              </label>
              <select
                value={member.degreeType}
                onChange={(e) => {
                  const newDegreeType = e.target.value;
                  setTeamMembers((prev) =>
                    prev.map((member, i) =>
                      i === index
                        ? {
                            ...member,
                            degreeType: newDegreeType,
                            degree: newDegreeType !== 'Other' ? newDegreeType : '',
                            customDegree: newDegreeType !== 'Other' ? '' : member.customDegree,
                          }
                        : member,
                    ),
                  );
                }}
                className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Custom Degree */}
            {member.degreeType === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Degree Name *
                </label>
                <input
                  type="text"
                  value={member.customDegree}
                  onChange={(e) => {
                    updateTeamMember(index, 'customDegree', e.target.value);
                    updateTeamMember(index, 'degree', e.target.value);
                  }}
                  className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  placeholder="Enter degree name"
                />
              </div>
            )}

            {/* Year of Study */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Year of Study *
              </label>
              <select
                value={member.yearOfStudy}
                onChange={(e) => updateTeamMember(index, 'yearOfStudy', e.target.value)}
                className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              >
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Branch *
              </label>
              <select
                value={member.branch}
                onChange={(e) => {
                  const selectedBranch = e.target.value;
                  setTeamMembers((prev) =>
                    prev.map((member, i) =>
                      i === index
                        ? {
                            ...member,
                            branch: selectedBranch,
                            customBranch: selectedBranch !== 'Other' ? '' : member.customBranch,
                          }
                        : member,
                    ),
                  );
                }}
                className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
              >
                <option value="">Select your branch</option>
                {BRANCHES.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Branch Input (only if Other is selected) */}
            {member.branch === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Enter Branch Name *
                </label>
                <input
                  type="text"
                  value={member.customBranch}
                  onChange={(e) => updateTeamMember(index, 'customBranch', e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                  placeholder="Enter branch name"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto">
          Back
        </Button>
        <Button
          variant="cyber"
          onClick={handleNext}
          disabled={!validateDetails()}
          className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

// Payment Step Component
const PaymentStep = ({
  price,
  eventType,
  teamSize,
  paymentScreenshot,
  setPaymentScreenshot,
  transactionId,
  setTransactionId,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  price: number;
  eventType: EventType;
  teamSize: number;
  paymentScreenshot: File | null;
  setPaymentScreenshot: (file: File | null) => void;
  transactionId: string;
  setTransactionId: (id: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentScreenshot(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-orbitron font-bold text-foreground mb-2">
          Payment Details
        </h3>
        <p className="text-foreground/60">Complete your registration payment</p>
      </div>

      {/* Payment Summary */}
      <div className="p-6 bg-primary/5 border border-primary/30 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-foreground/80">Event:</span>
          <span className="font-bold text-foreground">
            {eventType === 'hackathon' ? 'Hackathon' : 'Capture The Flag'}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-foreground/80">Team Size:</span>
          <span className="font-bold text-foreground">
            {teamSize} {teamSize === 1 ? 'Member' : 'Members'}
          </span>
        </div>
        <div className="border-t border-primary/30 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-foreground">Total Amount:</span>
            <span className="text-3xl font-orbitron font-bold text-primary">₹{price}</span>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="p-6 bg-primary/5 border border-primary/30 rounded-lg text-center">
        <h4 className="text-lg font-orbitron font-bold text-foreground mb-4">
          Scan to Pay
        </h4>
        <div className="inline-block p-4 bg-white rounded-lg">
          <img 
            src={qrPayment} 
            alt="Payment QR Code" 
            className="w-52 h-52 sm:w-64 sm:h-64 object-contain"
          />
        </div>
        <p className="mt-4 text-foreground/60">Scan this QR code with any UPI app to pay</p>
      </div>

      {/* Upload Screenshot */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Upload Payment Screenshot *
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="screenshot-upload"
          />
          <label
            htmlFor="screenshot-upload"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary/10 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary transition-colors cursor-pointer"
          >
            <Upload className="w-5 h-5 text-primary" />
            <span className="text-foreground">
              {paymentScreenshot ? paymentScreenshot.name : 'Choose file'}
            </span>
          </label>
        </div>
      </div>

      {/* Transaction ID */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Transaction ID *
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-primary/30 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
          placeholder="Enter transaction ID from payment confirmation"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} className="w-full sm:w-auto">
          Back
        </Button>
        <Button
          variant="cyber"
          onClick={onSubmit}
          disabled={!paymentScreenshot || !transactionId || isSubmitting}
          className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
        </Button>
      </div>
    </div>
  );
};

// Success Message Component
const SuccessMessage = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <CheckCircle2 className="w-24 h-24 text-primary mx-auto mb-6" />
      </motion.div>
      <h3 className="text-2xl font-orbitron font-bold text-foreground mb-4">
        Registration Successful!
      </h3>
      <p className="text-foreground/60 mb-6 max-w-md mx-auto">
        Thank you for registering for CyberFest 2026. We'll review your payment and send a
        confirmation email shortly.
      </p>
      
      {/* WhatsApp Group Link */}
      <div className="mb-8 p-6 bg-primary/5 border border-primary/30 rounded-lg max-w-md mx-auto">
        <h4 className="text-lg font-orbitron font-bold text-foreground mb-3">
          Join Our WhatsApp Group
        </h4>
        <p className="text-foreground/60 mb-4 text-sm">
          Stay updated with event details, announcements, and connect with other participants!
        </p>
        <a
          href="https://chat.whatsapp.com/EntfbZ9EMKuDKFvTyCdIYO"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button variant="cyber" className="w-full">
            Join WhatsApp Group
          </Button>
        </a>
      </div>
      
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
    </div>
  );
};

export default RegistrationDialog;
