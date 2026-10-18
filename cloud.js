/* Smart 3D Learning — Supabase data/auth adapter */
'use strict';

(function initSmart3DCloud() {
  const cfg = window.S3D_SUPABASE || {};
  const hasSettings = !!(cfg.url || cfg.publishableKey);
  const validUrl = (() => { try { const u = new URL(cfg.url); return u.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(u.hostname); } catch (_) { return false; } })();
  const configured = validUrl && !!cfg.publishableKey;
  const configurationError = hasSettings && !configured
    ? 'Supabase configuration is incomplete or the Project URL is invalid.'
    : (configured && !window.supabase ? 'Supabase JavaScript SDK could not be loaded.' : '');
  const client = configured && window.supabase
    ? window.supabase.createClient(cfg.url.replace(/\/$/, ''), cfg.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

  const emptyDB = () => ({ users: [], teachers: [], teacherInvites: [], grades: [], slots: {}, lab: [], labSaves: [] });
  const assert = (result) => {
    if (result && result.error) throw result.error;
    return result ? result.data : null;
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const safeName = (name) => String(name || 'file').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';
  const profileToLegacy = (p) => p.role === 'teacher'
    ? { id: p.id, name: p.name, email: p.email, lang: p.lang || 'ar', grades: p.teacher_grades || [], sems: p.teacher_sems || [], subjects: p.teacher_subjects || [] }
    : { id: p.id, name: p.name, email: p.email, grade: p.grade, sem: p.sem, track: p.track, parentCode: p.parent_code };
  const gradeToLegacy = (g) => ({
    id: g.id, studentId: g.student_id, subject: g.subject, title: g.title,
    score: Number(g.score), max: Number(g.max_score), teacher: g.teacher_label, date: g.grade_date,
  });
  const saveToRow = (s) => ({
    id: s.id, user_id: s.userId, model_id: s.modelId,
    data: { ...s, id: undefined, userId: undefined, modelId: undefined },
    created_at: new Date(s.ts || Date.now()).toISOString(),
  });

  async function currentProfile() {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) return null;
    const profile = assert(await client.from('profiles').select('*').eq('id', userData.user.id).single());
    return profile;
  }

  async function loadDatabase(profile) {
    const [slotRows, modelRows, profiles, gradeRows, saveRows, inviteRows] = await Promise.all([
      client.from('content_slots').select('slot_no,data').order('slot_no'),
      client.from('lab_models').select('id,data,storage_path,published,created_by').order('created_at'),
      client.from('profiles').select('*').order('created_at'),
      client.from('grades').select('*').order('created_at'),
      client.from('lab_saves').select('*').order('created_at'),
      profile.role === 'admin' ? client.from('teacher_invites').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    ]);
    [slotRows, modelRows, profiles, gradeRows, saveRows, inviteRows].forEach(assert);
    const db = emptyDB();
    (slotRows.data || []).forEach((row) => { db.slots[row.slot_no] = row.data || {}; });
    db.lab = (modelRows.data || []).map((row) => ({
      ...(row.data || {}), id: row.id, fileKey: row.storage_path, published: row.published, createdBy: row.created_by,
    }));
    db.users = (profiles.data || []).filter((p) => p.role === 'student').map(profileToLegacy);
    db.teachers = (profiles.data || []).filter((p) => p.role === 'teacher').map(profileToLegacy);
    db.grades = (gradeRows.data || []).map(gradeToLegacy);
    db.labSaves = (saveRows.data || []).map((row) => ({
      ...(row.data || {}), id: row.id, userId: row.user_id, modelId: row.model_id,
      ts: row.data && row.data.ts ? row.data.ts : new Date(row.created_at).getTime(),
    }));
    db.teacherInvites = inviteRows.data || [];
    return db;
  }

  async function stateForProfile(profile) {
    const db = await loadDatabase(profile);
    const session = { role: profile.role, id: profile.id, email: profile.email };
    return { db, session };
  }

  async function boot(storedSession) {
    if (!client) return null;
    if (storedSession && storedSession.role === 'parent' && storedSession.parentCode) {
      try { return await parentLogin(storedSession.parentCode); } catch (_) {}
    }
    const profile = await currentProfile();
    return profile ? stateForProfile(profile) : { db: emptyDB(), session: null };
  }

  async function signIn(email, password, expectedRole) {
    assert(await client.auth.signInWithPassword({ email, password }));
    const profile = await currentProfile();
    if (!profile || (expectedRole && profile.role !== expectedRole)) {
      await client.auth.signOut();
      throw new Error('role_mismatch');
    }
    return stateForProfile(profile);
  }

  async function signUpStudent(input) {
    const result = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { requested_role: 'student', name: input.name, grade: input.grade, sem: input.sem, track: input.track } },
    });
    assert(result);
    if (!result.data.session) return { pending: true };
    const profile = await currentProfile();
    return stateForProfile(profile);
  }

  async function signUpTeacher(input) {
    const result = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: {
        requested_role: 'teacher', teacher_invite_code: input.inviteCode, name: input.name, lang: input.lang,
        teacher_grades: input.grades, teacher_sems: input.sems, teacher_subjects: input.subjects,
      } },
    });
    assert(result);
    if (!result.data.session) return { pending: true };
    const profile = await currentProfile();
    return stateForProfile(profile);
  }

  async function signUpAdmin(input) {
    const result = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { requested_role: 'admin', name: input.name } },
    });
    assert(result);
    if (!result.data.session) return { pending: true };
    const profile = await currentProfile();
    if (!profile || profile.role !== 'admin') throw new Error('not_allowlisted_admin');
    return stateForProfile(profile);
  }

  async function parentLogin(code) {
    const data = assert(await client.rpc('parent_portal', { p_code: String(code || '').trim().toUpperCase() }));
    if (!data || !data.student) throw new Error('invalid_parent_code');
    const db = emptyDB();
    db.users = [data.student];
    db.grades = data.grades || [];
    return { db, session: { role: 'parent', id: data.student.id, parentCode: String(code).trim().toUpperCase() } };
  }

  async function signOut() {
    if (channel) { await client.removeChannel(channel); channel = null; }
    if (client) await client.auth.signOut();
  }

  async function upsertRows(table, rows, options) {
    if (!rows.length) return;
    assert(await client.from(table).upsert(rows, options));
  }

  async function removeMissing(table, idColumn, currentIds, queryBuilder) {
    let q = client.from(table).select(idColumn);
    if (queryBuilder) q = queryBuilder(q);
    const existing = assert(await q) || [];
    const missing = existing.map((r) => r[idColumn]).filter((id) => !currentIds.has(String(id)));
    if (missing.length) assert(await client.from(table).delete().in(idColumn, missing));
  }

  function slotRows(db) {
    return Object.entries(db.slots || {}).map(([slotNo, data]) => ({ slot_no: Number(slotNo), data: clone(data) }));
  }
  function modelRows(db, session) {
    return (db.lab || []).filter((m) => session.role === 'admin' || m.createdBy === session.id || m.by === `teacher:${session.id}`)
      .map((m) => {
        const data = clone(m); delete data.fileKey; delete data.createdBy;
        return { id: m.id, data, storage_path: m.fileKey, published: m.published !== false, created_by: m.createdBy || session.id };
      });
  }
  function gradeRows(db, session) {
    return (db.grades || []).filter((g) => session.role === 'admin'
      || (session.role === 'teacher' && g.teacher === session.email)
      || (session.role === 'student' && g.studentId === session.id && g.teacher === 'lab'))
      .map((g) => ({
        id: g.id, student_id: g.studentId, subject: g.subject, title: g.title,
        score: Number(g.score), max_score: Number(g.max), teacher_label: g.teacher || session.email || session.role,
        grade_date: g.date || new Date().toISOString().slice(0, 10),
      }));
  }

  async function sync(db, session) {
    if (!client || !session || session.role === 'parent') return;
    if (session.role === 'admin') {
      const rows = slotRows(db);
      await upsertRows('content_slots', rows, { onConflict: 'slot_no' });
      await removeMissing('content_slots', 'slot_no', new Set(rows.map((r) => String(r.slot_no))));
    }
    if (session.role === 'admin' || session.role === 'teacher') {
      const rows = modelRows(db, session);
      await upsertRows('lab_models', rows, { onConflict: 'id' });
      const ids = new Set(rows.map((r) => String(r.id)));
      await removeMissing('lab_models', 'id', ids, session.role === 'teacher' ? (q) => q.eq('created_by', session.id) : null);
    }
    const grades = gradeRows(db, session);
    await upsertRows('grades', grades, { onConflict: 'id' });
    if (session.role === 'student') {
      const saves = (db.labSaves || []).filter((s) => s.userId === session.id).map(saveToRow);
      await upsertRows('lab_saves', saves, { onConflict: 'id' });
      await removeMissing('lab_saves', 'id', new Set(saves.map((r) => r.id)), (q) => q.eq('user_id', session.id));
    }
  }

  let saveChain = Promise.resolve();
  function queueSave(db, session, onError) {
    if (!client || !session) return;
    const snapshot = clone(db);
    saveChain = saveChain.then(() => sync(snapshot, session)).catch((error) => {
      console.error('Supabase sync failed', error);
      if (onError) onError(error);
    });
  }

  async function uploadContent(file, prefix) {
    const path = `${prefix}/${Date.now()}-${safeName(file.name)}`;
    assert(await client.storage.from('content-assets').upload(path, file, { upsert: false, contentType: file.type || undefined }));
    return client.storage.from('content-assets').getPublicUrl(path).data.publicUrl;
  }
  async function putModel(key, blob) {
    assert(await client.storage.from('lab-models').upload(key, blob, { upsert: true, contentType: blob.type || 'model/gltf-binary' }));
  }
  async function getModel(key) {
    return assert(await client.storage.from('lab-models').download(key));
  }
  async function deleteModel(key) {
    assert(await client.storage.from('lab-models').remove([key]));
  }

  async function createTeacherInvite(input) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 10).toUpperCase();
    const user = assert(await client.auth.getUser()).user;
    const row = assert(await client.from('teacher_invites').insert({
      name: input.name, email: input.email.toLowerCase(), invite_code: code, created_by: user.id,
    }).select().single());
    return row;
  }
  async function deleteTeacherInvite(id) { assert(await client.from('teacher_invites').delete().eq('id', id)); }
  async function deleteUser(id) { assert(await client.rpc('admin_delete_user', { p_user_id: id })); }
  async function changePassword(password) { assert(await client.auth.updateUser({ password })); }
  async function resetData() { assert(await client.rpc('admin_reset_data')); }

  let channel = null;
  function subscribe(onChange) {
    if (!client) return;
    if (channel) client.removeChannel(channel);
    let timer = null;
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const profile = await currentProfile();
          if (profile) onChange(await stateForProfile(profile));
        } catch (error) { console.error('Realtime refresh failed', error); }
      }, 500);
    };
    channel = client.channel('smart-3d-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_slots' }, changed)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_models' }, changed)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grades' }, changed)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, changed)
      .subscribe();
  }

  window.S3DCloud = {
    enabled: !!client, configured, configurationError, client, emptyDB, boot, signIn, signUpStudent, signUpTeacher, signUpAdmin, parentLogin, signOut,
    queueSave, uploadContent, putModel, getModel, deleteModel, createTeacherInvite, deleteTeacherInvite,
    deleteUser, changePassword, resetData, subscribe,
  };
})();
