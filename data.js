// ============================================================
// data.js — Firestore data-access helpers shared by all modules
// Collections: students, classes, feePayments, results
// ============================================================
import {
  db, collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp
} from './firebase-config.js';

export function formatCurrency(n){
  const num = Number(n || 0);
  return 'Rs ' + num.toLocaleString('en-PK');
}

export function currentPeriod(){
  const d = new Date();
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' }); // e.g. "July 2026"
}

export function suggestStudentNo(){
  return 'STU' + Date.now().toString().slice(-6);
}

/* -------------------- STUDENTS -------------------- */
export async function addStudent(data){
  const ref = await addDoc(collection(db, 'students'), {
    ...data,
    admissionFeePaidAmount: Number(data.admissionFeePaidAmount || 0),
    monthlyFee: Number(data.monthlyFee || 0),
    annualFee: Number(data.annualFee || 0),
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateStudent(id, data){
  await updateDoc(doc(db, 'students', id), data);
}

export async function getStudent(id){
  const snap = await getDoc(doc(db, 'students', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllStudents(){
  const snap = await getDocs(query(collection(db, 'students'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function searchStudents(term){
  const all = await getAllStudents();
  if (!term) return all;
  const t = term.trim().toLowerCase();
  return all.filter(s =>
    (s.studentNo || '').toLowerCase().includes(t) ||
    (s.name || '').toLowerCase().includes(t) ||
    (s.className || '').toLowerCase().includes(t) ||
    (s.father || '').toLowerCase().includes(t)
  );
}

/* -------------------- CLASSES -------------------- */
export async function addClass(data){
  const ref = await addDoc(collection(db, 'classes'), {
    ...data,
    monthlyFee: Number(data.monthlyFee || 0),
    annualFee: Number(data.annualFee || 0),
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function getAllClasses(){
  const snap = await getDocs(query(collection(db, 'classes'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function studentsInClass(classId){
  const snap = await getDocs(query(collection(db, 'students'), where('classId', '==', classId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* -------------------- FEE PAYMENTS -------------------- */
export async function addFeePayment(payment){
  const ref = await addDoc(collection(db, 'feePayments'), {
    ...payment,
    amount: Number(payment.amount || 0),
    concession: Number(payment.concession || 0),
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function paymentsForStudent(studentId){
  const snap = await getDocs(query(collection(db, 'feePayments'), where('studentId', '==', studentId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function allFeePayments(){
  const snap = await getDocs(collection(db, 'feePayments'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Fee status for a single student: whether the current month's fee
 * and the one-time admission fee have been paid, per the flowchart's
 * "Display Fee Status: Paid / Pending / Remaining" step.
 */
export async function feeStatusForStudent(student){
  const payments = await paymentsForStudent(student.id);
  const period = currentPeriod();
  const monthlyPaidThisPeriod = payments.some(p => p.type === 'monthly' && p.period === period);
  const admissionPaid = !!student.admissionFeePaidAmount && student.admissionFeePaidAmount > 0;
  const totalReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAdmission = admissionPaid ? 0 : Number(student.admissionFee || 0);
  const pendingMonthly = monthlyPaidThisPeriod ? 0 : Number(student.monthlyFee || 0);
  const pendingAmount = pendingAdmission + pendingMonthly;
  return {
    totalReceived,
    pendingAmount,
    monthlyPaidThisPeriod,
    admissionPaid,
    isDefaulter: pendingAmount > 0,
    payments
  };
}

/**
 * Builds the full defaulter list: every student with a pending
 * balance for the current period.
 */
export async function getDefaulterList(){
  const students = await getAllStudents();
  const results = [];
  for (const s of students){
    const status = await feeStatusForStudent(s);
    if (status.isDefaulter){
      results.push({ ...s, pendingAmount: status.pendingAmount });
    }
  }
  return results;
}

/* -------------------- RESULTS -------------------- */
export async function addResult(result){
  const ref = await addDoc(collection(db, 'results'), {
    ...result,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function resultsForStudent(studentId){
  const snap = await getDocs(query(collection(db, 'results'), where('studentId', '==', studentId)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export function computeGrade(percentage){
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'Fail';
}

/* -------------------- BACKUP -------------------- */
export async function exportFullDatabase(){
  const [students, classes, feePayments, results] = await Promise.all([
    getAllStudents(), getAllClasses(), allFeePayments(),
    getDocs(collection(db, 'results')).then(s => s.docs.map(d => ({ id: d.id, ...d.data() })))
  ]);
  return {
    exportedAt: new Date().toISOString(),
    school: 'Haseeb School',
    students, classes, feePayments, results
  };
}

export function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
