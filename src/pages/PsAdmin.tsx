import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createPasswordHash, generateSaltHex, normalizeTeamKey } from '@/lib/psAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

type TeamRow = {
  id: string;
  displayName?: string;
  selectedPsId?: string;
  selectedPsTitle?: string;
};

type PsRow = {
  id: string;
  title?: string;
  track?: string;
  order?: number;
  assignedTeams?: string[];
  assignedCount?: number;
};

const PsAdmin = () => {
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [teamSaving, setTeamSaving] = useState(false);

  const [psTitle, setPsTitle] = useState('');
  const [psTrack, setPsTrack] = useState('Hackathon');
  const [psOrder, setPsOrder] = useState('');
  const [psDesc, setPsDesc] = useState('');
  const [psSaving, setPsSaving] = useState(false);

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [problemStatements, setProblemStatements] = useState<PsRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [seedLoading, setSeedLoading] = useState(false);
  const [seedOutput, setSeedOutput] = useState('');

  useEffect(() => {
    const authToken = sessionStorage.getItem('admin_auth');
    if (!authToken) navigate('/regdata');
  }, [navigate]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [teamSnap, psSnap] = await Promise.all([
        getDocs(collection(db, 'psTeams')),
        getDocs(collection(db, 'problemStatements')),
      ]);

      const teamRows: TeamRow[] = teamSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          displayName: typeof data.displayName === 'string' ? data.displayName : undefined,
          selectedPsId: typeof data.selectedPsId === 'string' ? data.selectedPsId : undefined,
          selectedPsTitle: typeof data.selectedPsTitle === 'string' ? data.selectedPsTitle : undefined,
        };
      });

      const psRows: PsRow[] = psSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          title: typeof data.title === 'string' ? data.title : undefined,
          track: typeof data.track === 'string' ? data.track : undefined,
          order: typeof data.order === 'number' ? data.order : undefined,
          assignedTeams: Array.isArray(data.assignedTeams) ? data.assignedTeams.filter((x: any) => typeof x === 'string') : undefined,
          assignedCount: typeof data.assignedCount === 'number' ? data.assignedCount : undefined,
        };
      });

      psRows.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
      teamRows.sort((a, b) => (a.displayName ?? a.id).localeCompare(b.displayName ?? b.id));

      setTeams(teamRows);
      setProblemStatements(psRows);
    } catch (e) {
      console.error('PS admin refresh error:', e);
      alert('Failed to load PS admin data. Check Firestore rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const upsertTeam = async () => {
    const displayName = teamName.trim();
    if (!displayName) {
      alert('Enter team name');
      return;
    }

    if (!teamPassword) {
      alert('Enter assigned password');
      return;
    }

    const key = normalizeTeamKey(displayName);
    if (!key) {
      alert('Invalid team name');
      return;
    }

    setTeamSaving(true);
    try {
      const salt = generateSaltHex(16);
      const passwordHash = await createPasswordHash(teamPassword, salt);

      await setDoc(
        doc(db, 'psTeams', key),
        {
          displayName,
          salt,
          passwordHash,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setTeamPassword('');
      await refresh();
      alert(`Saved team credentials: ${displayName}`);
    } catch (e) {
      console.error('Upsert team error:', e);
      alert('Failed to save team.');
    } finally {
      setTeamSaving(false);
    }
  };

  const addProblemStatement = async () => {
    const title = psTitle.trim();
    if (!title) {
      alert('Enter PS title');
      return;
    }

    const order = psOrder.trim() ? Number(psOrder) : undefined;
    if (psOrder.trim() && !Number.isFinite(order)) {
      alert('Order must be a number');
      return;
    }

    setPsSaving(true);
    try {
      await addDoc(collection(db, 'problemStatements'), {
        title,
        description: psDesc.trim() || null,
        track: psTrack.trim() || 'Hackathon',
        order: order ?? null,
        createdAt: serverTimestamp(),
      });

      setPsTitle('');
      setPsDesc('');
      setPsOrder('');
      await refresh();
      alert('Added problem statement');
    } catch (e) {
      console.error('Add PS error:', e);
      alert('Failed to add PS.');
    } finally {
      setPsSaving(false);
    }
  };

  const seedDemoData = async () => {
    const confirm = window.confirm(
      'Seed demo data?\n\nThis will create sample problem statements and teams (only if they do not already exist).'
    );
    if (!confirm) return;

    setSeedLoading(true);
    setSeedOutput('');

    try {
      const demoPs = [
        {
          id: 'PS-01',
          title: 'AI Phishing Detection for Campus Email',
          track: 'Hackathon',
          order: 1,
          description: 'Build a lightweight classifier + UI to detect phishing patterns in emails and generate explainable warnings.',
        },
        {
          id: 'PS-02',
          title: 'Blockchain Transaction Risk Scoring',
          track: 'Hackathon',
          order: 2,
          description: 'Create a risk scoring pipeline for wallets/transactions with heuristics and clear visualizations.',
        },
        {
          id: 'PS-03',
          title: 'Secure Passwordless Login Prototype',
          track: 'Hackathon',
          order: 3,
          description: 'Prototype a WebAuthn-based login with threat model notes and basic auditing UI.',
        },
        {
          id: 'PS-04',
          title: 'SOC Alert Triage Assistant',
          track: 'Hackathon',
          order: 4,
          description: 'Summarize and prioritize alerts; include rationale and playbook suggestions.',
        },
      ];

      const demoTeams = [
        { displayName: 'Team ZeroDay' },
        { displayName: 'Team ByteBandits' },
        { displayName: 'Team CipherCats' },
      ];

      const created: string[] = [];
      const skipped: string[] = [];

      // Seed problem statements with stable IDs (idempotent)
      for (const ps of demoPs) {
        const psRef = doc(db, 'problemStatements', ps.id);
        const existing = await getDoc(psRef);
        if (existing.exists()) {
          skipped.push(`PS exists: ${ps.id}`);
          continue;
        }

        await setDoc(psRef, {
          title: ps.title,
          track: ps.track,
          order: ps.order,
          description: ps.description,
          createdAt: serverTimestamp(),
          seeded: true,
        });

        created.push(`PS created: ${ps.id}`);
      }

      const credentials: Array<{ teamName: string; teamKey: string; password: string }> = [];

      // Seed teams (only if not exists)
      for (const team of demoTeams) {
        const teamKey = normalizeTeamKey(team.displayName);
        if (!teamKey) continue;

        const teamRef = doc(db, 'psTeams', teamKey);
        const existing = await getDoc(teamRef);
        if (existing.exists()) {
          skipped.push(`Team exists: ${team.displayName}`);
          continue;
        }

        const password = `CF26-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 6)}`;
        const salt = generateSaltHex(16);
        const passwordHash = await createPasswordHash(password, salt);

        await setDoc(teamRef, {
          displayName: team.displayName,
          salt,
          passwordHash,
          createdAt: serverTimestamp(),
          seeded: true,
        });

        created.push(`Team created: ${team.displayName}`);
        credentials.push({ teamName: team.displayName, teamKey, password });
      }

      const outputLines = [
        'Seed complete.',
        '',
        created.length ? 'Created:' : 'Created: (none)',
        ...created.map((x) => `- ${x}`),
        '',
        skipped.length ? 'Skipped:' : 'Skipped: (none)',
        ...skipped.map((x) => `- ${x}`),
        '',
        credentials.length ? 'Team credentials (for testing login):' : 'Team credentials: (none created)',
        ...credentials.map((c) => `- ${c.teamName}  |  key=${c.teamKey}  |  password=${c.password}`),
      ];

      setSeedOutput(outputLines.join('\n'));
      await refresh();
    } catch (e) {
      console.error('Seed error:', e);
      alert('Failed to seed demo data. Check Firestore rules and console.');
    } finally {
      setSeedLoading(false);
    }
  };

  const resetAssignment = async (psId: string) => {
    const confirm = window.confirm('Reset this problem statement assignment?');
    if (!confirm) return;

    try {
      const psRef = doc(db, 'problemStatements', psId);

      await runTransaction(db, async (tx) => {
        const psSnap = await tx.get(psRef);
        if (!psSnap.exists()) return;
        const ps = psSnap.data() as any;
        const assignedTeams: string[] = Array.isArray(ps.assignedTeams)
          ? ps.assignedTeams.filter((x: unknown): x is string => typeof x === 'string')
          : [];

        tx.update(psRef, {
          assignedTeams: deleteField(),
          assignedCount: deleteField(),
          lastAssignedAt: deleteField(),
        });

        for (const teamKey of assignedTeams) {
          const teamRef = doc(db, 'psTeams', teamKey);
          const teamSnap = await tx.get(teamRef);
          if (!teamSnap.exists()) continue;
          const team = teamSnap.data() as any;
          if (team.selectedPsId === psId) {
            tx.update(teamRef, {
              selectedPsId: deleteField(),
              selectedPsTitle: deleteField(),
              selectedAt: deleteField(),
            });
          }
        }
      });

      await refresh();
    } catch (e) {
      console.error('Reset assignment error:', e);
      alert('Failed to reset assignment.');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_auth');
    navigate('/regdata');
  };

  const takenCount = useMemo(
    () =>
      problemStatements.reduce((sum, p) => {
        const count = p.assignedCount ?? p.assignedTeams?.length ?? 0;
        return sum + (count > 0 ? 1 : 0);
      }, 0),
    [problemStatements]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Problem Statements Admin</h1>
            <p className="text-gray-300 text-sm">Manage team credentials and problem statement claiming.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/regdata/dashboard')}>Back to dashboard</Button>
            <Button variant="destructive" onClick={logout}>Logout</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Upsert Team Credential</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="ps-admin-team">Team name</Label>
                <Input id="ps-admin-team" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="bg-gray-900/50 border-gray-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="ps-admin-pass">Assigned password</Label>
                <Input id="ps-admin-pass" type="text" value={teamPassword} onChange={(e) => setTeamPassword(e.target.value)} className="bg-gray-900/50 border-gray-700 text-white" />
                <div className="text-xs text-gray-400">Tip: use a long random password; this is not Firebase Auth.</div>
              </div>
              <Button onClick={upsertTeam} disabled={teamSaving} className="w-full">
                {teamSaving ? 'Saving…' : 'Save Team'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Add Problem Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="ps-admin-title">Title</Label>
                <Input id="ps-admin-title" value={psTitle} onChange={(e) => setPsTitle(e.target.value)} className="bg-gray-900/50 border-gray-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="ps-admin-track">Track</Label>
                <Input id="ps-admin-track" value={psTrack} onChange={(e) => setPsTrack(e.target.value)} className="bg-gray-900/50 border-gray-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="ps-admin-order">Order (optional)</Label>
                <Input id="ps-admin-order" value={psOrder} onChange={(e) => setPsOrder(e.target.value)} className="bg-gray-900/50 border-gray-700 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300" htmlFor="ps-admin-desc">Description (optional)</Label>
                <Input id="ps-admin-desc" value={psDesc} onChange={(e) => setPsDesc(e.target.value)} className="bg-gray-900/50 border-gray-700 text-white" />
              </div>
              <Button onClick={addProblemStatement} disabled={psSaving} className="w-full">
                {psSaving ? 'Adding…' : 'Add Problem Statement'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Seed Demo Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-300">
                Creates a few sample problem statements and teams (only if missing) so you can test the selection flow.
              </div>
              <Button onClick={seedDemoData} disabled={seedLoading} className="w-full" variant="secondary">
                {seedLoading ? 'Seeding…' : 'Seed Demo Data'}
              </Button>
              {seedOutput ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">Output</div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(seedOutput);
                        alert('Copied to clipboard');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <Textarea value={seedOutput} readOnly className="bg-gray-900/50 border-gray-700 text-white min-h-[180px]" />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-purple-500/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-white">Current Status</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">PS: {problemStatements.length}</Badge>
                <Badge className="bg-purple-600">Taken: {takenCount}</Badge>
                <Button variant="secondary" onClick={refresh} disabled={loading}>
                  {loading ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="text-white font-semibold mb-2">Problem Statements</div>
              <div className="grid gap-3 md:grid-cols-2">
                {problemStatements.map((ps) => (
                  <div key={ps.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{ps.title ?? ps.id}</div>
                        <div className="text-xs text-gray-400">{ps.track ?? 'Hackathon'}{typeof ps.order === 'number' ? ` • #${ps.order}` : ''}</div>
                      </div>
                      {(() => {
                        const filled = ps.assignedCount ?? ps.assignedTeams?.length ?? 0;
                        if (filled >= 3) return <Badge className="bg-red-600">Full (3/3)</Badge>;
                        if (filled > 0) return <Badge className="bg-purple-600">{filled}/3</Badge>;
                        return <Badge className="bg-green-600">Free</Badge>;
                      })()}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resetAssignment(ps.id)}
                        disabled={(ps.assignedCount ?? ps.assignedTeams?.length ?? 0) === 0}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white font-semibold mb-2">Teams</div>
              <div className="grid gap-3 md:grid-cols-2">
                {teams.map((t) => (
                  <div key={t.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">{t.displayName ?? t.id}</div>
                        <div className="text-xs text-gray-400">Key: {t.id}</div>
                      </div>
                      {t.selectedPsId ? (
                        <Badge className="bg-purple-600">Selected</Badge>
                      ) : (
                        <Badge variant="secondary">None</Badge>
                      )}
                    </div>
                    {t.selectedPsId ? (
                      <div className="mt-2 text-sm text-gray-200">PS: {t.selectedPsTitle ?? t.selectedPsId}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PsAdmin;
