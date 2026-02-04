import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createPasswordHash, generateSaltHex, normalizeTeamKey } from '@/lib/psAuth';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  const [bulkTeamsLoading, setBulkTeamsLoading] = useState(false);
  const [bulkTeamsOutput, setBulkTeamsOutput] = useState('');

  const [bulkPsDocLoading, setBulkPsDocLoading] = useState(false);
  const [bulkPsDocOutput, setBulkPsDocOutput] = useState('');

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

  const extractString = (value: unknown): string => (typeof value === 'string' ? value : value == null ? '' : String(value));

  const makePsIdFromTitle = (title: string): string => {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
    return base || `ps-${Date.now()}`;
  };

  const buildPsDescription = (input: {
    difficulty?: string;
    domain?: string;
    problemContext?: string;
    objective?: string;
    deliverables?: string[];
  }) => {
    const top: string[] = [];
    if (input.difficulty) top.push(`Difficulty: ${input.difficulty}`);
    if (input.domain) top.push(`Domain: ${input.domain}`);

    const parts: string[] = [];
    if (top.length) parts.push(top.join(' • '));

    if (input.problemContext) parts.push(['Problem Context', input.problemContext].join('\n'));
    if (input.objective) parts.push(['Objective', input.objective].join('\n'));
    if (input.deliverables?.length) {
      parts.push(['Expected Deliverables', input.deliverables.map((d) => `- ${d}`).join('\n')].join('\n'));
    }

    const text = parts.join('\n\n').trim();
    return text || null;
  };

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

  const bulkUploadTeamsFromExcel = async (file: File) => {
    setBulkTeamsLoading(true);
    setBulkTeamsOutput('');

    try {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        alert('No sheets found in the Excel file.');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!rows.length) {
        alert('No rows found in the first sheet.');
        return;
      }

      const keys = Object.keys(rows[0] ?? {});
      const keyLowerMap = new Map(keys.map((k) => [k.toLowerCase().trim(), k] as const));

      const pickCol = (candidates: string[]) => {
        for (const cand of candidates) {
          const found = keyLowerMap.get(cand);
          if (found) return found;
        }
        return undefined;
      };

      const teamCol = pickCol(['team', 'team name', 'teamname', 'name']);
      const passCol = pickCol(['password', 'pass', 'pwd']);
      if (!teamCol || !passCol) {
        alert(
          `Missing required columns. Found: ${keys.join(', ')}\n\nNeed columns like: Team Name + Password.`
        );
        return;
      }

      const lines: string[] = [];
      let success = 0;
      let skipped = 0;
      let failed = 0;

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const displayName = extractString(row[teamCol]).trim();
        const password = extractString(row[passCol]);

        if (!displayName || !password) {
          skipped++;
          lines.push(`- Row ${index + 2}: skipped (missing team/password)`);
          continue;
        }

        const key = normalizeTeamKey(displayName);
        if (!key) {
          skipped++;
          lines.push(`- Row ${index + 2}: skipped (invalid team name: ${displayName})`);
          continue;
        }

        try {
          const salt = generateSaltHex(16);
          const passwordHash = await createPasswordHash(password, salt);

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
          success++;
        } catch (e) {
          failed++;
          console.error('Bulk team upload row error:', e);
          lines.push(`- Row ${index + 2}: failed (${displayName})`);
        }
      }

      setBulkTeamsOutput([
        `Bulk upload complete: ${success} saved, ${skipped} skipped, ${failed} failed.`,
        ...lines,
      ].join('\n'));

      await refresh();
    } finally {
      setBulkTeamsLoading(false);
    }
  };

  const bulkUploadProblemStatementsFromDocx = async (file: File) => {
    setBulkPsDocLoading(true);
    setBulkPsDocOutput('');

    try {
      const buf = await file.arrayBuffer();
      const mammoth = await import('mammoth/mammoth.browser');
      const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
      const raw = (value ?? '').replace(/\r\n/g, '\n').trim();

      if (!raw) {
        alert('No text could be extracted from the DOCX.');
        return;
      }

      type ParsedPs = {
        psNumber?: string;
        title: string;
        difficulty?: string;
        domain?: string;
        problemContext?: string;
        objective?: string;
        deliverables?: string[];
        track?: string;
        order?: number;
      };

      const parseStructuredDomainDoc = (text: string): ParsedPs[] => {
        const lines = text.split('\n').map((l) => l.trim());
        const result: ParsedPs[] = [];

        let currentTrack: string | undefined;
        let current: ParsedPs | null = null;
        let currentSection: 'context' | 'objective' | 'deliverables' | null = null;

        const flush = () => {
          if (!current) return;
          const title = current.title?.trim();
          if (!title) {
            current = null;
            currentSection = null;
            return;
          }
          current.problemContext = current.problemContext?.trim() || undefined;
          current.objective = current.objective?.trim() || undefined;
          current.deliverables = (current.deliverables ?? []).map((d) => d.trim()).filter(Boolean);
          if (!current.deliverables.length) current.deliverables = undefined;
          result.push(current);
          current = null;
          currentSection = null;
        };

        const sectionName = (l: string) => l.toLowerCase().replace(/\s+/g, ' ').trim();

        for (const line of lines) {
          if (!line) continue;

          const domMatch = line.match(/^domain\s*\d+\s*:\s*(.+)$/i);
          if (domMatch) {
            flush();
            currentTrack = domMatch[1].trim();
            continue;
          }

          const psMatch = line.match(/^ps\s*(\d+\.\d+)\s+(.+)$/i);
          if (psMatch) {
            flush();
            const psNumber = psMatch[1];
            const title = psMatch[2].trim();
            const m = psNumber.match(/^(\d+)\.(\d+)$/);
            const order = m ? Number(m[1]) * 100 + Number(m[2]) : undefined;
            current = {
              psNumber,
              title,
              track: currentTrack,
              order,
              deliverables: [],
            };
            currentSection = null;
            continue;
          }

          if (!current) continue;

          const kv = line.match(/^([A-Za-z][A-Za-z\s]+)\s*:\s*(.+)$/);
          if (kv) {
            const key = kv[1].toLowerCase().trim();
            const val = kv[2].trim();

            if (key === 'difficulty') {
              current.difficulty = val;
              currentSection = null;
              continue;
            }
            if (key === 'domain') {
              current.domain = val;
              currentSection = null;
              continue;
            }
          }

          const sec = sectionName(line);
          if (sec === 'problem context') {
            currentSection = 'context';
            current.problemContext = current.problemContext ?? '';
            continue;
          }
          if (sec === 'objective') {
            currentSection = 'objective';
            current.objective = current.objective ?? '';
            continue;
          }
          if (sec === 'expected deliverables') {
            currentSection = 'deliverables';
            current.deliverables = current.deliverables ?? [];
            continue;
          }

          if (currentSection === 'context') {
            current.problemContext = `${current.problemContext ?? ''}${current.problemContext ? '\n' : ''}${line}`;
            continue;
          }
          if (currentSection === 'objective') {
            current.objective = `${current.objective ?? ''}${current.objective ? '\n' : ''}${line}`;
            continue;
          }
          if (currentSection === 'deliverables') {
            current.deliverables = current.deliverables ?? [];
            current.deliverables.push(line.replace(/^[-•]\s*/, '').trim());
            continue;
          }
        }

        flush();
        return result;
      };

      const parsedStructured = parseStructuredDomainDoc(raw);

      // Fallback: simple “blank line separates items” parsing.
      const parseFallback = (text: string): Array<{ title: string; description: string | null; order?: number }> => {
        const blocks = text
          .split(/\n\s*\n+/g)
          .map((b) => b.trim())
          .filter(Boolean);

        const out: Array<{ title: string; description: string | null; order?: number }> = [];
        for (const block of blocks) {
          const lines = block
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);
          if (!lines.length) continue;

          const first = lines[0] ?? '';
          const m = first.match(/^\s*(\d{1,3})[\).\-\s]+(.+)$/);
          const order = m ? Number(m[1]) : undefined;
          const titleRaw = (m ? m[2] : first).replace(/^title\s*:\s*/i, '').trim();
          const title = titleRaw;
          if (!title) continue;

          const desc = lines.slice(1).join('\n').trim();
          out.push({ title, description: desc ? desc : null, order });
        }
        return out;
      };

      const fallback = parsedStructured.length ? null : parseFallback(raw);

      const toUpload: Array<{
        docId: string;
        title: string;
        description: string | null;
        track: string;
        order: number | null;
        extra?: Record<string, unknown>;
      }> = [];

      if (parsedStructured.length) {
        for (const ps of parsedStructured) {
          const docId = ps.psNumber ? `PS-${ps.psNumber}` : makePsIdFromTitle(ps.title);
          const description = buildPsDescription({
            difficulty: ps.difficulty,
            domain: ps.domain,
            problemContext: ps.problemContext,
            objective: ps.objective,
            deliverables: ps.deliverables,
          });
          toUpload.push({
            docId,
            title: ps.title,
            description,
            track: ps.track ?? 'Hackathon',
            order: typeof ps.order === 'number' ? ps.order : null,
            extra: {
              psNumber: ps.psNumber ?? null,
              difficulty: ps.difficulty ?? null,
              domain: ps.domain ?? null,
              problemContext: ps.problemContext ?? null,
              objective: ps.objective ?? null,
              expectedDeliverables: ps.deliverables ?? null,
            },
          });
        }
      } else {
        for (let index = 0; index < (fallback?.length ?? 0); index++) {
          const ps = fallback![index];
          const inferredOrder = ps.order ?? index + 1;
          const psId = makePsIdFromTitle(ps.title);
          toUpload.push({
            docId: psId,
            title: ps.title,
            description: ps.description,
            track: 'Hackathon',
            order: inferredOrder,
          });
        }
      }

      if (!toUpload.length) {
        alert('Could not parse any problem statements from the DOCX.');
        return;
      }

      const ok = window.confirm(`Upload ${toUpload.length} problem statements from this DOCX into Firestore?`);
      if (!ok) return;

      let success = 0;
      let failed = 0;
      const failures: string[] = [];

      for (let index = 0; index < toUpload.length; index++) {
        const ps = toUpload[index];
        try {
          await setDoc(
            doc(db, 'problemStatements', ps.docId),
            {
              title: ps.title,
              description: ps.description,
              track: ps.track,
              order: ps.order,
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              ...(ps.extra ?? {}),
            } as any,
            { merge: true }
          );
          success++;
        } catch (e) {
          failed++;
          console.error('Bulk PS upload error:', e);
          failures.push(`- ${ps.title} (id=${ps.docId})`);
        }
      }

      setBulkPsDocOutput(
        [`Bulk PS upload complete: ${success} saved, ${failed} failed.`, ...failures].join('\n')
      );
      await refresh();
    } finally {
      setBulkPsDocLoading(false);
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
              <CardTitle className="text-white">Bulk Upload Team Credentials (Excel)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-300">
                Upload an Excel sheet with columns like <span className="font-semibold">Team Name</span> and <span className="font-semibold">Password</span>.
              </div>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="bg-gray-900/50 border-gray-700 text-white"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void bulkUploadTeamsFromExcel(file);
                  e.currentTarget.value = '';
                }}
                disabled={bulkTeamsLoading}
              />
              <div className="text-xs text-gray-400">Passwords are hashed + salted before saving.</div>
              {bulkTeamsOutput ? (
                <pre className="whitespace-pre-wrap text-xs bg-gray-900/50 border border-gray-700 rounded-md p-3 text-gray-200 max-h-56 overflow-auto">{bulkTeamsOutput}</pre>
              ) : null}
              <Button className="w-full" variant="secondary" disabled>
                {bulkTeamsLoading ? 'Uploading…' : 'Select a file above to upload'}
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
              <CardTitle className="text-white">Bulk Upload Problem Statements (DOCX)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-300">
                Upload a <span className="font-semibold">.docx</span> where each problem statement is separated by a blank line. The first line becomes the title; remaining lines become the description.
              </div>
              <Input
                type="file"
                accept=".docx"
                className="bg-gray-900/50 border-gray-700 text-white"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void bulkUploadProblemStatementsFromDocx(file);
                  e.currentTarget.value = '';
                }}
                disabled={bulkPsDocLoading}
              />
              {bulkPsDocOutput ? (
                <pre className="whitespace-pre-wrap text-xs bg-gray-900/50 border border-gray-700 rounded-md p-3 text-gray-200 max-h-56 overflow-auto">{bulkPsDocOutput}</pre>
              ) : null}
              <Button className="w-full" variant="secondary" disabled>
                {bulkPsDocLoading ? 'Uploading…' : 'Select a DOCX above to upload'}
              </Button>
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
