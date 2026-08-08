// ============================================================
// auth.js — Autenticación e xestión de perfís
// ============================================================

import { supabase } from './supabase.js';

// ── SESIÓN ──
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data?.subscription?.unsubscribe();
}

// ── REXISTRO E LOGIN ──
export async function signUp(email, password, nome) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome } },
  });
  if (error) return { ok: false, error: traducirErro(error.message) };
  return { ok: true, data };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: traducirErro(error.message) };
  return { ok: true, data };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  return { ok: !error, error: error ? traducirErro(error.message) : null };
}

// ── PERFIL ──
export async function getPerfil(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function updatePerfil(userId, campos) {
  const { error } = await supabase.from('perfis').update(campos).eq('id', userId);
  return !error;
}

// ── ADMIN: XESTIÓN DE USUARIOS ──
export async function listarUsuarios() {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function aprobarUsuario(userId, aprobado) {
  const { error } = await supabase.from('perfis').update({ aprobado }).eq('id', userId);
  return !error;
}

export async function cambiarRol(userId, rol) {
  const { error } = await supabase.from('perfis').update({ rol }).eq('id', userId);
  return !error;
}

// ── DINÁMICAS COMPARTIDAS ──
export async function proporCompartir(dinamicaId) {
  const { error } = await supabase
    .from('dinamicas')
    .update({ proposta_compartir: true })
    .eq('id', dinamicaId);
  return !error;
}

export async function listarPropostasCompartir() {
  const { data, error } = await supabase
    .from('dinamicas')
    .select('*, perfis(nome,email)')
    .eq('proposta_compartir', true)
    .eq('compartida', false);
  if (error) return [];
  return data || [];
}

export async function aprobarCompartir(dinamicaId, aprobar) {
  const campos = aprobar
    ? { compartida: true, proposta_compartir: false }
    : { proposta_compartir: false };
  const { error } = await supabase.from('dinamicas').update(campos).eq('id', dinamicaId);
  return !error;
}

// ── PLANTILLAS DE ESCENA ──
export async function getPlantillas(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('plantillas_escena')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error) return [];
  return data || [];
}

export async function savePlantilla(userId, nome, cats) {
  const { data, error } = await supabase
    .from('plantillas_escena')
    .insert({ user_id: userId, nome, cats })
    .select()
    .single();
  return error ? null : data;
}

export async function deletePlantilla(id) {
  const { error } = await supabase.from('plantillas_escena').delete().eq('id', id);
  return !error;
}

// ── UTILIDADES ──
function traducirErro(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email ou contrasinal incorrectos.';
  if (m.includes('already registered')) return 'Este email xa está rexistrado.';
  if (m.includes('password') && m.includes('6')) return 'O contrasinal debe ter polo menos 6 caracteres.';
  if (m.includes('email') && m.includes('valid')) return 'Email non válido.';
  if (m.includes('rate limit')) return 'Demasiados intentos. Agarda un momento.';
  return msg || 'Erro descoñecido.';
}
