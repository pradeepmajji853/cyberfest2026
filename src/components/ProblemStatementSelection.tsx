import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { normalizeTeamKey, verifyPassword } from '@/lib/psAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ProblemStatement = {
  id: string;
  title: string;
  description?: string;
  track?: string;
  difficulty?: string | null;
  domain?: string | null;
  problemContext?: string | null;
  objective?: string | null;
  expectedDeliverables?: string[] | null;
  order?: number;
  assignedTeams: string[];
  isSpecialTrack?: boolean;
  pdfLink?: string | null;
  maxTeams?: number;
};

type PsTeam = {
  displayName?: string;
  salt?: string;
  passwordHash?: string;
  selectedPsId?: string;
  selectedPsTitle?: string;
};

const safeNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

const asString = (value: unknown) => (typeof value === 'string' ? value : undefined);

const mapProblemStatement = (id: string, data: DocumentData): ProblemStatement => ({
  id,
  title: asString(data.title) ?? id,
  description: asString(data.description),
  track: asString(data.track),
  difficulty: asString(data.difficulty) ?? (data.difficulty === null ? null : undefined),
  domain: asString(data.domain) ?? (data.domain === null ? null : undefined),
  problemContext: asString(data.problemContext) ?? (data.problemContext === null ? null : undefined),
  objective: asString(data.objective) ?? (data.objective === null ? null : undefined),
  expectedDeliverables: Array.isArray(data.expectedDeliverables)
    ? data.expectedDeliverables.filter((x: unknown): x is string => typeof x === 'string')
    : data.expectedDeliverables === null
      ? null
      : undefined,
  order: safeNumber(data.order),
  assignedTeams: Array.isArray(data.assignedTeams)
    ? data.assignedTeams.filter((x: unknown): x is string => typeof x === 'string')
    : [],
  isSpecialTrack: typeof data.isSpecialTrack === 'boolean' ? data.isSpecialTrack : undefined,
  pdfLink: asString(data.pdfLink) ?? (data.pdfLink === null ? null : undefined),
  maxTeams: safeNumber(data.maxTeams),
});

const ProblemStatementSelection = () => {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [teamKey, setTeamKey] = useState<string | null>(null);
  const [teamDoc, setTeamDoc] = useState<PsTeam | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [psList, setPsList] = useState<ProblemStatement[]>([]);
  const [psLoading, setPsLoading] = useState(true);
  const [psLoadError, setPsLoadError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const [psSearch, setPsSearch] = useState('');
  const [psTrackFilter, setPsTrackFilter] = useState<'generic' | 'special'>('generic');
  const [psDifficultyFilter, setPsDifficultyFilter] = useState<string>('all');
  const [psDomainFilter, setPsDomainFilter] = useState<string>('all');

  const [psDialogOpen, setPsDialogOpen] = useState(false);
  const [selectedPs, setSelectedPs] = useState<ProblemStatement | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'problemStatements'),
      (snap) => {
        try {
          const list = snap.docs.map((d) => mapProblemStatement(d.id, d.data()));
          list.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
          setPsList(list);
          setPsLoading(false);
          setPsLoadError(null);
        } catch (e) {
          console.error('Error processing problem statements:', e);
          setPsLoadError('Failed to process problem statements data.');
          setPsLoading(false);
        }
      },
      (err) => {
        console.error('Problem statements snapshot error:', err);
        let errorMsg = 'Failed to load problem statements.';
        
        if (err.code === 'permission-denied') {
          errorMsg = 'Access denied. Please contact organizers.';
        } else if (err.code === 'unavailable') {
          errorMsg = 'Connection lost. Please check your internet and refresh.';
        } else if (err.code === 'failed-precondition') {
          errorMsg = 'Database configuration error. Please contact organizers.';
        }
        
        setPsLoadError(errorMsg);
        setPsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    // Reset filters when switching tracks
    setPsDifficultyFilter('all');
    setPsDomainFilter('all');
  }, [psTrackFilter]);

  const authenticated = !!teamKey;

  const selectedPsId = teamDoc?.selectedPsId;

  const genericPsList = useMemo(() => {
    return psList.filter((ps) => !ps.isSpecialTrack);
  }, [psList]);

  const psDifficulties = useMemo(() => {
    const set = new Set<string>();
    for (const ps of genericPsList) {
      if (ps.difficulty && ps.difficulty.trim()) set.add(ps.difficulty.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [genericPsList]);

  const psDomains = useMemo(() => {
    const set = new Set<string>();
    for (const ps of genericPsList) {
      if (ps.domain && ps.domain.trim()) set.add(ps.domain.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [genericPsList]);

  const trackPsCount = useMemo(() => {
    return psList.filter((ps) => {
      if (psTrackFilter === 'generic') return !ps.isSpecialTrack;
      if (psTrackFilter === 'special') return ps.isSpecialTrack === true;
      return false;
    }).length;
  }, [psList, psTrackFilter]);

  const filteredPsList = useMemo(() => {
    const q = psSearch.trim().toLowerCase();

    return psList.filter((ps) => {
      // Track filtering: Generic shows all non-special PS, Special shows only special PS
      if (psTrackFilter === 'generic' && ps.isSpecialTrack) return false;
      if (psTrackFilter === 'special' && !ps.isSpecialTrack) return false;

      // Difficulty and Domain filters (only for generic track)
      if (psTrackFilter === 'generic') {
        if (psDifficultyFilter !== 'all' && (ps.difficulty ?? '').trim() !== psDifficultyFilter) return false;
        if (psDomainFilter !== 'all' && (ps.domain ?? '').trim() !== psDomainFilter) return false;
      }

      // Search filtering
      if (!q) return true;
      const hay = [ps.id, ps.title, ps.track ?? '', ps.difficulty ?? '', ps.domain ?? ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [psList, psSearch, psTrackFilter, psDifficultyFilter, psDomainFilter]);

  const openPsDetails = (ps: ProblemStatement) => {
    if (!ps || !ps.id) {
      console.error('Invalid problem statement data');
      return;
    }
    setSelectedPs(ps);
    setPsDialogOpen(true);
  };

  const canClaim = useMemo(() => {
    if (!authenticated) return false;
    if (!teamDoc) return false;
    // Lock to a single selection; admin can reset.
    if (teamDoc.selectedPsId) return false;
    return true;
  }, [authenticated, teamDoc]);

  const authenticate = async () => {
    setAuthError(null);
    setClaimError(null);
    setClaimSuccess(null);

    const displayName = teamName.trim();
    if (!displayName) {
      setAuthError('Enter your team name.');
      return;
    }

    const key = normalizeTeamKey(displayName);
    if (!key) {
      setAuthError('Invalid team name.');
      return;
    }

    if (!password) {
      setAuthError('Enter your assigned password.');
      return;
    }

    setAuthLoading(true);
    try {
      const ref = doc(db, 'psTeams', key);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setAuthError('Team not found. Check team name spelling.');
        return;
      }

      const data = snap.data() as PsTeam;
      
      if (!data) {
        setAuthError('Invalid team data. Contact organizers.');
        return;
      }
      
      const salt = data.salt;
      const hash = data.passwordHash;

      if (!salt || !hash) {
        setAuthError('Team password not set. Contact organizers.');
        return;
      }

      const ok = await verifyPassword(password, salt, hash);
      if (!ok) {
        setAuthError('Wrong password.');
        return;
      }

      // Refresh selection state (keep minimal locally)
      setTeamKey(key);
      setTeamDoc({
        displayName: data.displayName ?? displayName,
        salt,
        passwordHash: hash,
        selectedPsId: data.selectedPsId,
        selectedPsTitle: data.selectedPsTitle,
      });

      setClaimSuccess(null);
      setClaimError(null);
    } catch (e: any) {
      console.error('Auth error:', e);
      let errorMsg = 'Authentication failed. Try again.';
      
      if (e?.code === 'permission-denied') {
        errorMsg = 'Access denied. Contact organizers.';
      } else if (e?.code === 'unavailable') {
        errorMsg = 'Connection error. Check your internet connection.';
      } else if (e?.code === 'not-found') {
        errorMsg = 'Team not found. Verify your team name.';
      } else if (e?.message) {
        errorMsg = e.message;
      }
      
      setAuthError(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setTeamKey(null);
    setTeamDoc(null);
    setPassword('');
    setAuthError(null);
    setClaimError(null);
    setClaimSuccess(null);
  };

  const claimProblemStatement = async (psId: string) => {
    if (!teamKey || !teamDoc) {
      setClaimError('Not authenticated. Please log in first.');
      return;
    }

    if (!navigator.onLine) {
      setClaimError('No internet connection. Please check your network and try again.');
      return;
    }

    // Verify the PS still exists in the current list
    const psExists = psList.find((ps) => ps.id === psId);
    if (!psExists) {
      setClaimError('Problem statement not found. It may have been removed. Please refresh the page.');
      return;
    }

    setClaimError(null);
    setClaimSuccess(null);
    setClaimingId(psId);

    try {
      const psRef = doc(db, 'problemStatements', psId);
      const teamRef = doc(db, 'psTeams', teamKey);

      await runTransaction(db, async (tx) => {
        const [psSnap, teamSnap] = await Promise.all([tx.get(psRef), tx.get(teamRef)]);

        if (!psSnap.exists()) {
          throw new Error('Problem statement not found or has been removed.');
        }
        if (!teamSnap.exists()) {
          throw new Error('Team not found. Please re-authenticate.');
        }

        const ps = psSnap.data() as DocumentData;
        const team = teamSnap.data() as DocumentData;
        
        if (!ps || !team) {
          throw new Error('Invalid data. Please try again or contact organizers.');
        }

        const alreadySelected = typeof team.selectedPsId === 'string' ? team.selectedPsId : undefined;
        if (alreadySelected && alreadySelected !== psId) {
          throw new Error('Your team has already selected a different problem statement.');
        }

        const assignedTeams: string[] = Array.isArray(ps.assignedTeams)
          ? ps.assignedTeams.filter((x: unknown): x is string => typeof x === 'string')
          : [];

        const isAlreadyIn = assignedTeams.includes(teamKey);
        const maxTeams = typeof ps.maxTeams === 'number' ? ps.maxTeams : 3;
        
        if (!isAlreadyIn && assignedTeams.length >= maxTeams) {
          throw new Error(`This problem statement is full (${maxTeams}/${maxTeams} teams). Please select another.`);
        }

        const nextAssignedTeams = isAlreadyIn ? assignedTeams : [...assignedTeams, teamKey];

        // Idempotent: if already selected, keep state consistent.
        tx.set(
          psRef,
          {
            assignedTeams: nextAssignedTeams,
            assignedCount: nextAssignedTeams.length,
            lastAssignedAt: serverTimestamp(),
          },
          { merge: true }
        );

        const displayName =
          (typeof team.displayName === 'string' && team.displayName.trim()) || teamDoc.displayName || teamName.trim();

        tx.set(
          teamRef,
          {
            displayName,
            selectedPsId: psId,
            selectedPsTitle: (typeof ps.title === 'string' && ps.title) || psId,
            selectedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      const psTitle = psList.find((p) => p.id === psId)?.title ?? psId;
      setClaimSuccess(`✓ Successfully selected: ${psTitle}`);
      setTeamDoc((prev) => (prev ? { ...prev, selectedPsId: psId, selectedPsTitle: psTitle } : prev));
    } catch (e: any) {
      console.error('Claim error:', e);
      let errorMsg = e?.message || 'Failed to select. Try again.';
      
      if (e?.code === 'permission-denied') {
        errorMsg = 'Access denied. You may not have permission to select problem statements.';
      } else if (e?.code === 'unavailable') {
        errorMsg = 'Connection lost. Check your internet and try again.';
      } else if (e?.code === 'aborted') {
        errorMsg = 'Selection conflict detected. Another team may have selected this simultaneously. Please try again.';
      } else if (e?.code === 'deadline-exceeded') {
        errorMsg = 'Request timed out. Check your connection and try again.';
      } else if (e?.code === 'failed-precondition') {
        errorMsg = 'Database error. Please contact organizers.';
      }
      
      setClaimError(errorMsg);
    } finally {
      setClaimingId(null);
    }
  };

  const renderAuth = () => {
    if (authenticated && teamDoc) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="font-orbitron text-lg text-foreground">Team: {teamDoc.displayName ?? teamName}</div>
            {selectedPsId ? (
              <div className="text-sm text-foreground/70">
                Selected PS: <span className="text-primary font-semibold">{teamDoc.selectedPsTitle ?? selectedPsId}</span>
              </div>
            ) : (
              <div className="text-sm text-foreground/70">No problem statement selected yet.</div>
            )}
          </div>
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="ps-team-name">Team name</Label>
          <Input
            id="ps-team-name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && teamName.trim() && password) {
                authenticate();
              }
            }}
            placeholder="e.g., Team ZeroDay"
            autoComplete="organization"
            disabled={authLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ps-team-password">Assigned password</Label>
          <Input
            id="ps-team-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && teamName.trim() && password) {
                authenticate();
              }
            }}
            placeholder="Provided by organizers"
            type="password"
            autoComplete="current-password"
            disabled={authLoading}
          />
        </div>
        <div className="flex items-end">
          <Button 
            className="w-full" 
            onClick={authenticate} 
            disabled={authLoading || !teamName.trim() || !password}
          >
            {authLoading ? 'Authenticating…' : 'Authenticate'}
          </Button>
        </div>
      </div>
    );
  };

  const effectiveTeamKey = teamKey;

  return (
    <div className="cyber-card rounded-xl p-6 neon-border">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-orbitron text-xl font-bold text-primary">Problem Statement Selection</h3>
          <p className="font-rajdhani text-foreground/80">
            Authenticate with your team name + assigned password to select a problem statement. Selections lock to 1 PS per team.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary">
          Live
        </Badge>
      </div>

      <div className="space-y-4">
        {renderAuth()}

        {authError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{authError}</div>
        )}
        {claimError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{claimError}</div>
        )}
        {claimSuccess && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">{claimSuccess}</div>
        )}

        {psLoadError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-red-200 mb-1">Error Loading Problem Statements</div>
                <div className="text-sm text-red-200/80">{psLoadError}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-red-500/40 text-red-200 hover:bg-red-500/20"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-primary/20 pt-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-orbitron text-base text-foreground">
              {psTrackFilter === 'generic' ? 'Generic Problem Statements' : '⭐ Special Problem Statements'}
            </div>
            {psLoading ? <div className="text-sm text-foreground/60">Loading…</div> : null}
          </div>

          <div className="space-y-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant={psTrackFilter === 'generic' ? 'default' : 'outline'}
                onClick={() => setPsTrackFilter('generic')}
                className="flex-1 sm:flex-none"
              >
                Generic Problem Statements
              </Button>
              <Button 
                variant={psTrackFilter === 'special' ? 'default' : 'outline'}
                onClick={() => setPsTrackFilter('special')}
                className={`flex-1 sm:flex-none ${psTrackFilter === 'special' ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600' : 'hover:bg-yellow-600/10'}`}
              >
                ⭐ Special Problem Statements
              </Button>
            </div>

            {psTrackFilter === 'generic' && (psDifficulties.length > 0 || psDomains.length > 0) && (
              <div className="grid gap-2 sm:grid-cols-2">
                {psDifficulties.length > 0 && (
                  <Select value={psDifficultyFilter} onValueChange={setPsDifficultyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All difficulties</SelectItem>
                      {psDifficulties.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {psDomains.length > 0 && (
                  <Select value={psDomainFilter} onValueChange={setPsDomainFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All domains</SelectItem>
                      {psDomains.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <Input
              value={psSearch}
              onChange={(e) => setPsSearch(e.target.value)}
              placeholder="Search by PS id or title…"
              className="w-full"
            />

            {psTrackFilter === 'generic' && (psDifficultyFilter !== 'all' || psDomainFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPsDifficultyFilter('all');
                  setPsDomainFilter('all');
                }}
                className="w-full sm:w-auto"
              >
                Clear filters
              </Button>
            )}
          </div>

          <div className="text-xs text-foreground/60 mb-3">
            Showing {filteredPsList.length} of {trackPsCount} {psTrackFilter === 'generic' ? 'generic' : 'special'} problem statements
          </div>

          {trackPsCount === 0 && !psLoading ? (
            <div className="text-sm text-foreground/70">
              No {psTrackFilter === 'generic' ? 'generic' : 'special'} problem statements published yet.
            </div>
          ) : filteredPsList.length === 0 && !psLoading ? (
            <div className="text-sm text-foreground/70">
              No problem statements match your search.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredPsList.map((ps) => {
                    const filled = ps.assignedTeams.length;
                    const maxTeams = ps.maxTeams ?? 3;
                    const full = filled >= maxTeams;
                    const takenByYou = !!effectiveTeamKey && ps.assignedTeams.includes(effectiveTeamKey);
                    const disabled = !authenticated || (!takenByYou && (!canClaim || full));

                return (
                  <div key={ps.id} className="rounded-lg border border-primary/20 bg-black/20 p-4 hover:border-primary/40 hover:bg-black/30 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openPsDetails(ps)}
                          className="w-full text-left"
                        >
                          <div className="font-orbitron text-base text-foreground leading-snug">
                            <span className="text-foreground/60 mr-2">{ps.id}</span>
                            {ps.title}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {ps.track ? <Badge variant="secondary">{ps.track}</Badge> : null}
                            {ps.isSpecialTrack ? <Badge className="bg-yellow-600 text-white">⭐ Special</Badge> : null}
                            {ps.difficulty ? <Badge className="bg-blue-600 text-white">{ps.difficulty}</Badge> : null}
                            {ps.domain ? <Badge className="bg-emerald-600 text-white">{ps.domain}</Badge> : null}
                            {typeof ps.order === 'number' ? <Badge variant="outline" className="border-primary/30">#{ps.order}</Badge> : null}
                          </div>
                        </button>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {takenByYou ? (
                          <Badge className="bg-primary text-primary-foreground">Yours</Badge>
                        ) : full ? (
                          <Badge variant="secondary">Full</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500/40 text-green-300">
                            {filled}/{maxTeams} filled
                          </Badge>
                        )}
                      </div>
                    </div>

                    {ps.description ? (
                      <p className="mt-3 text-sm text-foreground/75 leading-relaxed line-clamp-3">{ps.description}</p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-foreground/60">
                        {full ? `Team limit reached (${maxTeams}).` : `Slots left: ${Math.max(0, maxTeams - filled)}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openPsDetails(ps)}>
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => claimProblemStatement(ps.id)}
                          disabled={disabled || claimingId === ps.id || (claimingId !== null && claimingId !== ps.id)}
                          title={
                            !authenticated 
                              ? 'Please authenticate first' 
                              : full 
                              ? 'This problem statement is full' 
                              : !canClaim && !takenByYou
                              ? 'You have already selected a problem statement'
                              : claimingId !== null && claimingId !== ps.id
                              ? 'Please wait for current selection to complete'
                              : ''
                          }
                        >
                          {takenByYou ? 'Selected' : claimingId === ps.id ? 'Selecting…' : 'Select'}
                        </Button>
                      </div>
                    </div>

                    {!authenticated ? (
                      <div className="mt-2 text-xs text-foreground/60">⚠ Authenticate to enable selection.</div>
                    ) : authenticated && !canClaim && !takenByYou ? (
                      <div className="mt-2 text-xs text-amber-400/80">✓ Your team has already selected a problem statement.</div>
                    ) : full && !takenByYou ? (
                      <div className="mt-2 text-xs text-orange-400/80">⚠ This problem statement is full. Try another one.</div>
                    ) : claimingId !== null && claimingId !== ps.id ? (
                      <div className="mt-2 text-xs text-blue-400/80">⏳ Selection in progress, please wait...</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={psDialogOpen} onOpenChange={setPsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPs?.title ?? selectedPs?.id ?? 'Problem Statement'}</DialogTitle>
            <DialogDescription>{selectedPs?.id ? `ID: ${selectedPs.id}` : null}</DialogDescription>
          </DialogHeader>

          {selectedPs ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedPs.track ? <Badge variant="secondary">{selectedPs.track}</Badge> : null}
                {selectedPs.isSpecialTrack ? <Badge className="bg-yellow-600 text-white">⭐ Special</Badge> : null}
                {selectedPs.difficulty ? <Badge className="bg-blue-600 text-white">{selectedPs.difficulty}</Badge> : null}
                {selectedPs.domain ? <Badge className="bg-emerald-600 text-white">{selectedPs.domain}</Badge> : null}
                {typeof selectedPs.order === 'number' ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Order #{selectedPs.order}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Teams: {selectedPs.assignedTeams.length}/{selectedPs.maxTeams ?? 3}
                </Badge>
              </div>

              {selectedPs.problemContext ? (
                <div className="space-y-1">
                  <div className="font-orbitron text-sm text-foreground">Problem Context</div>
                  <div className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedPs.problemContext}</div>
                </div>
              ) : null}

              {selectedPs.objective ? (
                <div className="space-y-1">
                  <div className="font-orbitron text-sm text-foreground">Objective</div>
                  <div className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedPs.objective}</div>
                </div>
              ) : null}

              {selectedPs.expectedDeliverables?.length ? (
                <div className="space-y-1">
                  <div className="font-orbitron text-sm text-foreground">Expected Deliverables</div>
                  <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
                    {selectedPs.expectedDeliverables.map((d, i) => (
                      <li key={`${selectedPs.id}-deliv-${i}`}>{d}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedPs.description ? (
                <div className="space-y-1">
                  <div className="font-orbitron text-sm text-foreground">Full Text</div>
                  <div className="text-sm text-foreground/80 whitespace-pre-wrap">{selectedPs.description}</div>
                </div>
              ) : null}

              {selectedPs.pdfLink ? (
                <div className="space-y-2">
                  <div className="font-orbitron text-sm text-foreground">Full Problem Statement (PDF)</div>
                  <Button
                    onClick={() => window.open(selectedPs.pdfLink!, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    📄 Download/View Full PDF
                  </Button>
                  <div className="text-xs text-foreground/60">Opens Google Drive link in a new tab</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProblemStatementSelection;
