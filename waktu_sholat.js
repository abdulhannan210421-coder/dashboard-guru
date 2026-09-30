// =========================================================================
// ALGORITMA FALAK WAKTU SHOLAT MANDIRI (100% OFFLINE & ZERO DEPENDENCY)
// =========================================================================

const DATABASE_BULAN = {
  4:  { nama: "April",     buruj: 0,  tafawut: 10, dBuruj: 0,  arah: "UTARA" },
  5:  { nama: "Mei",       buruj: 1,  tafawut: 9,  dBuruj: 30, arah: "UTARA" },
  6:  { nama: "Juni",      buruj: 2,  tafawut: 9,  dBuruj: 60, arah: "UTARA" },
  7:  { nama: "Juli",      buruj: 3,  tafawut: 7,  dBuruj: 0,  arah: "UTARA" },
  8:  { nama: "Agustus",   buruj: 4,  tafawut: 7,  dBuruj: 30, arah: "UTARA" },
  9:  { nama: "September", buruj: 5,  tafawut: 7,  dBuruj: 60, arah: "UTARA" },
  10: { nama: "Oktober",   buruj: 6,  tafawut: 6,  dBuruj: 0,  arah: "SELATAN" },
  11: { nama: "Nopember",  buruj: 7,  tafawut: 7,  dBuruj: 30, arah: "SELATAN" },
  12: { nama: "Desember",  buruj: 8,  tafawut: 7,  dBuruj: 60, arah: "SELATAN" },
  1:  { nama: "Januari",   buruj: 9,  tafawut: 9,  dBuruj: 0,  arah: "SELATAN" },
  2:  { nama: "Februari",  buruj: 10, tafawut: 10, dBuruj: 30, arah: "SELATAN" },
  3:  { nama: "Maret",     buruj: 11, tafawut: 8,  dBuruj: 60, arah: "SELATAN" }
};

const BURUJ_LOOKUP = [
  { dBuruj: 0,  arah: "UTARA" },
  { dBuruj: 30, arah: "UTARA" },
  { dBuruj: 60, arah: "UTARA" },
  { dBuruj: 0,  arah: "UTARA" },
  { dBuruj: 30, arah: "UTARA" },
  { dBuruj: 60, arah: "UTARA" },
  { dBuruj: 0,  arah: "SELATAN" },
  { dBuruj: 30, arah: "SELATAN" },
  { dBuruj: 60, arah: "SELATAN" },
  { dBuruj: 0,  arah: "SELATAN" },
  { dBuruj: 30, arah: "SELATAN" },
  { dBuruj: 60, arah: "SELATAN" }
];

// --- FUNGSI BANTUAN TRIGONOMETRI & LOGARITMA ---
function calcLogSin(deg) { const r = (deg * Math.PI) / 180, v = Math.abs(Math.sin(r)); return v === 0 ? 0 : 10 + Math.log10(v); }
function calcLogCos(deg) { const r = (deg * Math.PI) / 180, v = Math.abs(Math.cos(r)); return v === 0 ? 0 : 10 + Math.log10(v); }
function calcSin(deg) { return Math.sin((deg * Math.PI) / 180); }
function calcCos(deg) { return Math.cos((deg * Math.PI) / 180); }
function calcCot(deg) { return 1 / Math.tan((deg * Math.PI) / 180); }

function invLogSin(logVal) {
  let target = Math.round(logVal * 1e5) / 1e5, bestD = 0, bestM = 0;
  for (let d = 0; d < 90; d++) {
    for (let m = 0; m < 60; m++) {
      if (Math.round(calcLogSin(d + m / 60) * 1e5) / 1e5 <= target) { bestD = d; bestM = m; }
    }
  }
  return { deg: bestD, min: bestM };
}

function invSin(sinVal) {
  let target = Math.round(sinVal * 1e5) / 1e5, bestD = 0, bestM = 0;
  for (let d = 0; d < 90; d++) {
    for (let m = 0; m < 60; m++) {
      if (Math.round(calcSin(d + m / 60) * 1e5) / 1e5 <= target) { bestD = d; bestM = m; }
    }
  }
  return { deg: bestD, min: bestM };
}

function invCot(cotVal) {
  let target = Math.round(cotVal * 1e5) / 1e5;
  for (let d = 1; d < 90; d++) {
    for (let m = 0; m < 60; m++) {
      if (Math.round(calcCot(d + m / 60) * 1e5) / 1e5 <= target) return { deg: d, min: m };
    }
  }
  return { deg: 89, min: 59 };
}

function addDms(d1, m1, d2, m2) {
  let total = (d1 * 60 + m1) + (d2 * 60 + m2);
  return { deg: Math.floor(total / 60), min: total % 60 };
}

function subDms(d1, m1, d2, m2) {
  let total = (d1 * 60 + m1) - (d2 * 60 + m2);
  if (total < 0) total += 360 * 60;
  return { deg: Math.floor(total / 60), min: total % 60 };
}

function convertLattice4(deg, min) {
  let minMult = min * 4;
  let minCarry = Math.floor(minMult / 60);
  let minRem = minMult % 60;

  let degMult = deg * 4;
  let degCarry = Math.floor(degMult / 60);
  let degRem = degMult % 60;

  let detik = minRem;
  let menitSum = minCarry + degRem;
  let jamCarry = Math.floor(menitSum / 60);
  let menit = menitSum % 60;
  let jam = (degCarry + jamCarry) % 24;

  return { jam, menit, detik };
}

// --- FUNGSI UTAMA HITUNG WAKTU SHOLAT ---
// latDeg, latMin, latArah contoh Sidogiri / Pasuruan: latDeg = 7, latMin = 39, latArah = "SELATAN"
function hitungWaktuSholatFalak(dateObj = new Date(), latDeg = 7, latMin = 39, latArah = "SELATAN") {
  const tglInput = dateObj.getDate();
  const blnInput = dateObj.getMonth() + 1;

  const refBulan = DATABASE_BULAN[blnInput] || DATABASE_BULAN[1];
  const R = {};

  R.tgl = tglInput;
  R.tafawut = refBulan.tafawut;
  R.burujAwal = refBulan.buruj;

  let sumSyams = R.tgl + R.tafawut;
  let burujTambah = sumSyams > 30 ? 1 : 0;
  R.darajahSyams = sumSyams > 30 ? sumSyams - 30 : sumSyams;
  R.burujAkhir = (R.burujAwal + burujTambah) % 12;

  R.darajahBuruj = BURUJ_LOOKUP[R.burujAkhir].dBuruj;
  R.arahAkhir = BURUJ_LOOKUP[R.burujAkhir].arah;
  R.majmuah = R.darajahSyams + R.darajahBuruj;
  R.qaidah90 = 90;

  const golDirect = [0, 1, 2, 6, 7, 8];
  R.budDarajah = golDirect.includes(R.burujAkhir) ? R.majmuah : R.qaidah90 - R.majmuah;

  R.logSinBud = calcLogSin(R.budDarajah);
  R.logSinMaylAzham = 9.59983;

  let totalLogSin1 = R.logSinBud + R.logSinMaylAzham;
  if (totalLogSin1 >= 10) totalLogSin1 -= 10;
  R.logSinMaylAwwal = totalLogSin1;

  const maylAwwalDms = invLogSin(R.logSinMaylAwwal);
  R.maylAwwalDeg = maylAwwalDms.deg; 
  R.maylAwwalMin = maylAwwalDms.min;

  R.latDeg = latDeg; R.latMin = latMin; R.latArah = latArah;
  R.isArahSama = (R.arahAkhir === R.latArah);

  if (R.isArahSama) {
    let m1 = R.maylAwwalDeg * 60 + R.maylAwwalMin;
    let m2 = R.latDeg * 60 + R.latMin;
    let diff = Math.abs(m1 - m2);
    R.tamamGhayahDeg = Math.floor(diff / 60);
    R.tamamGhayahMin = diff % 60;
  } else {
    let res = addDms(R.maylAwwalDeg, R.maylAwwalMin, R.latDeg, R.latMin);
    R.tamamGhayahDeg = res.deg; R.tamamGhayahMin = res.min;
  }

  let ghayahRes = subDms(90, 0, R.tamamGhayahDeg, R.tamamGhayahMin);
  R.ghayahIrtifaDeg = ghayahRes.deg; R.ghayahIrtifaMin = ghayahRes.min;

  R.logSinArdhBalad = calcLogSin(R.latDeg + R.latMin / 60);

  let sumLogQutr = R.logSinMaylAwwal + R.logSinArdhBalad;
  if (sumLogQutr >= 10) sumLogQutr -= 10;
  R.logSinBudQutr = sumLogQutr;
  const budQutrDms = invLogSin(R.logSinBudQutr);
  R.budQutrDeg = budQutrDms.deg; R.budQutrMin = budQutrDms.min;

  R.logCosMaylAwwal = calcLogCos(R.maylAwwalDeg + R.maylAwwalMin / 60);
  R.logCosArdhBalad = calcLogCos(R.latDeg + R.latMin / 60);

  let sumLogAsl = R.logCosMaylAwwal + R.logCosArdhBalad;
  if (sumLogAsl >= 10) sumLogAsl -= 10;
  R.logSinAslMutlaq = sumLogAsl;

  R.logSinNishfFadhlah = (R.logSinBudQutr + 10) - R.logSinAslMutlaq;
  const nishfFadhlahDms = invLogSin(R.logSinNishfFadhlah);
  R.nishfFadhlahDeg = nishfFadhlahDms.deg; R.nishfFadhlahMin = nishfFadhlahDms.min;

  R.sinQaus1 = 0.00975;
  R.sinBudQutr = calcSin(R.budQutrDeg + R.budQutrMin / 60);

  R.sinMujtama1 = R.sinQaus1 + R.sinBudQutr;
  const mujtama1Dms = invSin(R.sinMujtama1);

  R.logSinMujtama1 = calcLogSin(mujtama1Dms.deg + mujtama1Dms.min / 60);
  R.logSinBaqi1 = (R.logSinMujtama1 + 10) - R.logSinAslMutlaq;
  const baqi1Dms = invLogSin(R.logSinBaqi1);

  let ikhtilafRes = subDms(baqi1Dms.deg, baqi1Dms.min, R.nishfFadhlahDeg, R.nishfFadhlahMin);

  R.sinQaus2 = 0.00436;
  R.sinMujtama2 = R.sinQaus2 + R.sinBudQutr;
  const mujtama2Dms = invSin(R.sinMujtama2);

  R.logSinMujtama2 = calcLogSin(mujtama2Dms.deg + mujtama2Dms.min / 60);
  R.logSinBaqi2 = (R.logSinMujtama2 + 10) - R.logSinAslMutlaq;
  const baqi2Dms = invLogSin(R.logSinBaqi2);

  let qutrSyamsRes = subDms(baqi2Dms.deg, baqi2Dms.min, R.nishfFadhlahDeg, R.nishfFadhlahMin);
  let tamkiniyahRes = addDms(qutrSyamsRes.deg, qutrSyamsRes.min, ikhtilafRes.deg, ikhtilafRes.min);

  if (R.isArahSama) {
    R.qausHaqiqiRes = addDms(90, 0, R.nishfFadhlahDeg, R.nishfFadhlahMin);
  } else {
    R.qausHaqiqiRes = subDms(90, 0, R.nishfFadhlahDeg, R.nishfFadhlahMin);
  }

  R.qausMaraiRes = addDms(R.qausHaqiqiRes.deg, R.qausHaqiqiRes.min, tamkiniyahRes.deg, tamkiniyahRes.min);
  const maghribBox = convertLattice4(R.qausMaraiRes.deg, R.qausMaraiRes.min);

  // --- SUBOH & ISYA ---
  R.logSinIsyaPaten = 9.46594;
  R.logSinBaqiIsya = (R.logSinIsyaPaten + 10) - R.logSinAslMutlaq;
  const baqiIsyaDms = invLogSin(R.logSinBaqiIsya);
  R.sinBaqiIsya = calcSin(baqiIsyaDms.deg + baqiIsyaDms.min / 60);
  R.sinNishfFadhlah = calcSin(R.nishfFadhlahDeg + R.nishfFadhlahMin / 60);

  R.sinHasilIsya = R.isArahSama ? (R.sinBaqiIsya + R.sinNishfFadhlah) : (R.sinBaqiIsya - R.sinNishfFadhlah);
  const hasilIsyaDms = invSin(R.sinHasilIsya);
  let resIsya = R.isArahSama ? subDms(hasilIsyaDms.deg, hasilIsyaDms.min, R.nishfFadhlahDeg, R.nishfFadhlahMin)
                             : addDms(hasilIsyaDms.deg, hasilIsyaDms.min, R.nishfFadhlahDeg, R.nishfFadhlahMin);
  let awalIsyaRes = addDms(resIsya.deg, resIsya.min, R.qausMaraiRes.deg, R.qausMaraiRes.min);
  const isyaBox = convertLattice4(awalIsyaRes.deg, awalIsyaRes.min);

  R.logSinSubhPaten = 9.51264;
  R.logSinBaqiSubh = (R.logSinSubhPaten + 10) - R.logSinAslMutlaq;
  const baqiSubhDms = invLogSin(R.logSinBaqiSubh);
  R.sinBaqiSubh = calcSin(baqiSubhDms.deg + baqiSubhDms.min / 60);

  R.sinHasilSubh = R.isArahSama ? (R.sinBaqiSubh + R.sinNishfFadhlah) : (R.sinBaqiSubh - R.sinNishfFadhlah);
  const hasilSubhDms = invSin(R.sinHasilSubh);
  let resSubh = R.isArahSama ? subDms(hasilSubhDms.deg, hasilSubhDms.min, R.nishfFadhlahDeg, R.nishfFadhlahMin)
                             : addDms(hasilSubhDms.deg, hasilSubhDms.min, R.nishfFadhlahDeg, R.nishfFadhlahMin);

  let qausThuluRes = subDms(180, 0, R.qausMaraiRes.deg, R.qausMaraiRes.min);
  let totalMinLail = qausThuluRes.deg * 60 + qausThuluRes.min;
  let totalMinFajr = resSubh.deg * 60 + resSubh.min;
  let diffSubhMin = Math.abs(totalMinLail - totalMinFajr);
  const subhBox = convertLattice4(Math.floor(diffSubhMin / 60), diffSubhMin % 60);

  // --- ASAR ---
  R.cotGhayahIrtifa = calcCot(R.ghayahIrtifaDeg + R.ghayahIrtifaMin / 60);
  R.cotIrtifaAsr = R.cotGhayahIrtifa + 1.00000;
  const irtifaAsrDms = invCot(R.cotIrtifaAsr);
  R.sinIrtifaAsr = calcSin(irtifaAsrDms.deg + irtifaAsrDms.min / 60);
  R.sinBudQutrAsr = calcSin(R.budQutrDeg + R.budQutrMin / 60);

  R.sinMuaddalAsr = R.isArahSama ? (R.sinIrtifaAsr - R.sinBudQutrAsr) : (R.sinIrtifaAsr + R.sinBudQutrAsr);
  const muaddalAsrDms = invSin(R.sinMuaddalAsr);
  R.logSinMuaddalAsr = calcLogSin(muaddalAsrDms.deg + muaddalAsrDms.min / 60);
  R.logSinTamamFadhlAsr = (R.logSinMuaddalAsr + 10) - R.logSinAslMutlaq;
  const tamamFadhlAsrDms = invLogSin(R.logSinTamamFadhlAsr);

  let rawAsrDeg = tamamFadhlAsrDms.deg + tamamFadhlAsrDms.min / 60;
  let finalAsrDegFloat = (rawAsrDeg < 45) ? (90 - rawAsrDeg) : rawAsrDeg;
  let fAsrDeg = Math.floor(finalAsrDegFloat);
  let fAsrMin = Math.round((finalAsrDegFloat - fAsrDeg) * 60);
  if (fAsrMin === 60) { fAsrDeg += 1; fAsrMin = 0; }
  const asrBox = convertLattice4(fAsrDeg, fAsrMin);

  // Helper Format HH:MM
  const pad = n => String(n).padStart(2, '0');

  // HASIL PERHITUNGAN DALAM WAKTU ISTIWA
  return {
    subuh:   `${pad(subhBox.jam)}:${pad(subhBox.menit)}`,
    dzuhur:  "12:04", // Waktu Dzuhur Paten Istiwa Sesuai Permintaan
    ashar:   `${pad((asrBox.jam + 12) % 24)}:${pad(asrBox.menit)}`,
    maghrib: `${pad((maghribBox.jam + 12) % 24)}:${pad(maghribBox.menit)}`,
    isya:    `${pad((isyaBox.jam + 12) % 24)}:${pad(isyaBox.menit)}`
  };
}
