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
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const [psSearch, setPsSearch] = useState('');
  const [psTrackFilter, setPsTrackFilter] = useState<string>('all');
  const [psDifficultyFilter, setPsDifficultyFilter] = useState<string>('all');
  const [psDomainFilter, setPsDomainFilter] = useState<string>('all');
  const [psAvailabilityFilter, setPsAvailabilityFilter] = useState<string>('all');

  const [psDialogOpen, setPsDialogOpen] = useState(false);
  const [selectedPs, setSelectedPs] = useState<ProblemStatement | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'problemStatements'),
      (snap) => {
        const list = snap.docs.map((d) => mapProblemStatement(d.id, d.data()));
        list.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
        setPsList(list);
        setPsLoading(false);
      },
      (err) => {
        console.error('Problem statements snapshot error:', err);
        setPsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const authenticated = !!teamKey;

  const selectedPsId = teamDoc?.selectedPsId;

  const psTracks = useMemo(() => {
    const set = new Set<string>();
    for (const ps of psList) {
      if (ps.track && ps.track.trim()) set.add(ps.track.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [psList]);

  const psDifficulties = useMemo(() => {
    const set = new Set<string>();
    for (const ps of psList) {
      if (ps.difficulty && ps.difficulty.trim()) set.add(ps.difficulty.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [psList]);

  const psDomains = useMemo(() => {
    const set = new Set<string>();
    for (const ps of psList) {
      if (ps.domain && ps.domain.trim()) set.add(ps.domain.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [psList]);

  const filteredPsList = useMemo(() => {
    const q = psSearch.trim().toLowerCase();
    const availabilityOf = (ps: ProblemStatement) => {
      const filled = ps.assignedTeams.length;
      if (filled <= 0) return 'free';
      if (filled >= 3) return 'full';
      return 'partial';
    };

    return psList.filter((ps) => {
      if (psTrackFilter !== 'all' && (ps.track ?? '').trim() !== psTrackFilter) return false;
      if (psDifficultyFilter !== 'all' && (ps.difficulty ?? '').trim() !== psDifficultyFilter) return false;
      if (psDomainFilter !== 'all' && (ps.domain ?? '').trim() !== psDomainFilter) return false;
      if (psAvailabilityFilter !== 'all' && availabilityOf(ps) !== psAvailabilityFilter) return false;

      if (!q) return true;
      const hay = [ps.id, ps.title, ps.track ?? '', ps.difficulty ?? '', ps.domain ?? ''].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [psAvailabilityFilter, psDifficultyFilter, psDomainFilter, psList, psSearch, psTrackFilter]);

  const openPsDetails = (ps: ProblemStatement) => {
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
    } catch (e) {
      console.error('Auth error:', e);
      setAuthError('Authentication failed. Try again.');
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
    if (!teamKey || !teamDoc) return;

    setClaimError(null);
    setClaimSuccess(null);
    setClaimingId(psId);

    try {
      const psRef = doc(db, 'problemStatements', psId);
      const teamRef = doc(db, 'psTeams', teamKey);

      await runTransaction(db, async (tx) => {
        const [psSnap, teamSnap] = await Promise.all([tx.get(psRef), tx.get(teamRef)]);

        if (!psSnap.exists()) {
          throw new Error('Problem statement not found.');
        }
        if (!teamSnap.exists()) {
          throw new Error('Team not found. Please re-authenticate.');
        }

        const ps = psSnap.data() as DocumentData;
        const team = teamSnap.data() as DocumentData;

        const alreadySelected = typeof team.selectedPsId === 'string' ? team.selectedPsId : undefined;
        if (alreadySelected && alreadySelected !== psId) {
          throw new Error('Your team has already selected a problem statement.');
        }

        const assignedTeams: string[] = Array.isArray(ps.assignedTeams)
          ? ps.assignedTeams.filter((x: unknown): x is string => typeof x === 'string')
          : [];

        const isAlreadyIn = assignedTeams.includes(teamKey);
        if (!isAlreadyIn && assignedTeams.length >= 3) {
          throw new Error('This problem statement has reached its team limit (3).');
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
      setClaimSuccess(`Selected: ${psTitle}`);
      setTeamDoc((prev) => (prev ? { ...prev, selectedPsId: psId, selectedPsTitle: psTitle } : prev));
    } catch (e: any) {
      console.error('Claim error:', e);
      setClaimError(e?.message || 'Failed to select. Try again.');
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
            placeholder="e.g., Team ZeroDay"
            autoComplete="organization"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ps-team-password">Assigned password</Label>
          <Input
            id="ps-team-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Provided by organizers"
            type="password"
            autoComplete="current-password"
          />
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={authenticate} disabled={authLoading}>
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

        <div className="border-t border-primary/20 pt-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="font-orbitron text-base text-foreground">Available problem statements</div>
            {psLoading ? <div className="text-sm text-foreground/60">Loading…</div> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5 mb-4">
            <Input
              value={psSearch}
              onChange={(e) => setPsSearch(e.target.value)}
              placeholder="Search PS id/title/domain…"
              className="lg:col-span-2"
            />

            <Select value={psTrackFilter} onValueChange={setPsTrackFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tracks</SelectItem>
                {psTracks.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            <Select value={psAvailabilityFilter} onValueChange={setPsAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free (0/3)</SelectItem>
                <SelectItem value="partial">Available (1-2/3)</SelectItem>
                <SelectItem value="full">Full (3/3)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 mb-4">
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

            <Button
              variant="secondary"
              onClick={() => {
                setPsSearch('');
                setPsTrackFilter('all');
                setPsDifficultyFilter('all');
                setPsDomainFilter('all');
                setPsAvailabilityFilter('all');
              }}
            >
              Clear filters
            </Button>
          </div>

          <div className="text-xs text-foreground/60 mb-3">Showing {filteredPsList.length} of {psList.length}</div>

          {psList.length === 0 && !psLoading ? (
            <div className="text-sm text-foreground/70">No problem statements published yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredPsList.map((ps) => {
                    const filled = ps.assignedTeams.length;
                    const full = filled >= 3;
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
                            {filled}/3 filled
                          </Badge>
                        )}
                      </div>
                    </div>

                    {ps.description ? (
                      <p className="mt-3 text-sm text-foreground/75 leading-relaxed line-clamp-3">{ps.description}</p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-foreground/60">
                        {full ? 'Team limit reached (3).' : `Slots left: ${Math.max(0, 3 - filled)}`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openPsDetails(ps)}>
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => claimProblemStatement(ps.id)}
                          disabled={disabled || claimingId === ps.id}
                        >
                          {takenByYou ? 'Selected' : claimingId === ps.id ? 'Selecting…' : 'Select'}
                        </Button>
                      </div>
                    </div>

                    {!authenticated ? (
                      <div className="mt-2 text-xs text-foreground/60">Authenticate to enable selection.</div>
                    ) : null}
                    {authenticated && !canClaim && !takenByYou ? (
                      <div className="mt-2 text-xs text-foreground/60">Selection is locked after choosing a PS.</div>
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
                {selectedPs.difficulty ? <Badge className="bg-blue-600 text-white">{selectedPs.difficulty}</Badge> : null}
                {selectedPs.domain ? <Badge className="bg-emerald-600 text-white">{selectedPs.domain}</Badge> : null}
                {typeof selectedPs.order === 'number' ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    Order #{selectedPs.order}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Teams: {selectedPs.assignedTeams.length}/3
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
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProblemStatementSelection;
