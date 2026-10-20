import { useRef, useState } from 'react'
import { Printer, Camera, Trash2, AlertCircle } from 'lucide-react'

const FACULTY_COLORS = {
  'Faculty of Engineering':               { bg: '#fef3c7', border: '#b45309', text: '#78350f' },
  'Faculty of Computing and Informatics': { bg: '#dbeafe', border: '#1d4ed8', text: '#1e3a8a' },
  'Faculty of Education':                 { bg: '#dcfce7', border: '#15803d', text: '#14532d' },
  'Faculty of Health Sciences':           { bg: '#fce7f3', border: '#be185d', text: '#831843' },
  'Faculty of Law':                       { bg: '#ede9fe', border: '#6d28d9', text: '#4c1d95' },
  'Faculty of Science':                   { bg: '#cffafe', border: '#0e7490', text: '#164e63' },
  'Faculty of Business and Management':   { bg: '#fef9c3', border: '#a16207', text: '#713f12' },
  'Faculty of Arts and Social Sciences':  { bg: '#ffedd5', border: '#c2410c', text: '#7c2d12' },
  'School of Postgraduate Studies':       { bg: '#f1f5f9', border: '#334155', text: '#0f172a' },
  default:                                { bg: '#fce4ec', border: '#9d174d', text: '#831843' },
}

function resolveColor(faculty, configuredColors) {
  const colors = configuredColors || FACULTY_COLORS
  if (!faculty) return colors.default || FACULTY_COLORS.default
  if (colors[faculty]) return colors[faculty]
  const match = Object.keys(colors).find((k) =>
    faculty.toLowerCase().includes(k.toLowerCase().split(' ').slice(2, 4).join(' '))
  )
  return colors[match] || colors.default || FACULTY_COLORS.default
}

function calcAge(dob) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function academicYear() {
  const y = new Date().getFullYear()
  const base = new Date().getMonth() >= 7 ? y : y - 1
  return `${base}/${base + 1}`
}

// A single row: "Label: value" — dotted line only when value is absent
function Row({ label, value, style }) {
  const empty = !value || value === '—'
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', ...style }}>
      <span style={{ fontWeight: '700', whiteSpace: 'nowrap', fontSize: '12px' }}>{label}:</span>
      {empty ? (
        <span style={{
          flex: 1,
          borderBottom: '1.5px dotted currentColor',
          opacity: 0.35,
          minWidth: '40px',
          paddingBottom: '1px',
        }} />
      ) : (
        <span style={{ fontSize: '12px', fontWeight: '500', letterSpacing: '0.2px' }}>{value}</span>
      )}
    </div>
  )
}

export default function MedicalCard({ profile, onPhotoChange, cardSettings }) {
  const printRef  = useRef(null)
  const inputRef  = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [printErr,  setPrintErr]  = useState(false)

  const color    = resolveColor(profile?.faculty, cardSettings?.faculty_colors)
  const age      = calcAge(profile?.dob || profile?.date_of_birth)
  const photoUrl = profile?.photo_url || null

  // Student cards expire in the course-completion year; display the year only.
  const computedExpiry = profile?.year_of_entry && profile?.course_duration
    ? String(Number(profile.year_of_entry) + Number(profile.course_duration))
    : null
  const storedExpiryYear = profile?.medical_card_expiry
    ? String(profile.medical_card_expiry).slice(0, 4)
    : null
  const expiry = computedExpiry || storedExpiryYear

  const fullName = (profile?.full_name ||
    `${profile?.firstname || ''} ${profile?.lastname || ''}`).trim().toUpperCase()

  const sex = profile?.sex === 'male'   || profile?.gender === 'M' ? 'MALE'
            : profile?.sex === 'female' || profile?.gender === 'F' ? 'FEMALE'
            : null

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try { await onPhotoChange(file) }
    finally { setUploading(false); e.target.value = '' }
  }

  const handlePrint = () => {
    if (!photoUrl) { setPrintErr(true); return }
    setPrintErr(false)
    const html = printRef.current?.innerHTML
    const win  = window.open('', '_blank', 'width=680,height=460')
    win.document.write(`<!DOCTYPE html><html><head>
      <title>KYU Medical Card — ${fullName}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        html, body { width:100%; height:100%; }
        body {
          background:#fff;
          display:flex;
          align-items:center;
          justify-content:center;
          min-height:100vh;
        }
        body, body * {
          -webkit-print-color-adjust:exact !important;
          print-color-adjust:exact !important;
          color-adjust:exact !important;
        }
        @media print {
          body { min-height:100%; }
          @page { size:A5 landscape; margin:6mm; }
        }
      </style>
    </head><body>${html}</body></html>`)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 350)
  }

  // Card style constants — single font family throughout
  const cardFont  = '"Times New Roman", Georgia, serif'
  const cardColor = color.text

  return (
    <div className="space-y-3">

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold text-gray-700">Your Medical Card</p>
        <div className="flex gap-2 items-center">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Camera size={13} />
            {uploading ? 'Uploading…' : photoUrl ? 'Change Photo' : 'Upload Photo'}
          </button>
          {photoUrl && (
            <button
              onClick={() => onPhotoChange(null)}
              className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
          >
            <Printer size={13} /> Print Card
          </button>
        </div>
      </div>

      {printErr && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <AlertCircle size={13} className="shrink-0" />
          Upload your passport photo before printing.
        </div>
      )}

      {/* ── THE CARD ── */}
      <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
        <div ref={printRef}>
        <div style={{
          background:   color.bg,
          border:       `2.5px solid ${color.border}`,
          borderRadius: '8px',
          padding:      '16px 18px 14px',
          width:        '520px',
          minWidth:     '520px',
          fontFamily:   cardFont,
          color:        cardColor,
          position:     'relative',
          boxShadow:    '0 3px 14px rgba(0,0,0,0.13)',
        }}>

          {/* Inner decorative border */}
          <div style={{
            position:      'absolute',
            inset:         '5px',
            border:        `1px solid ${color.border}`,
            borderRadius:  '4px',
            pointerEvents: 'none',
            opacity:       0.4,
          }} />

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '10px', position: 'relative' }}>
            {/* Crest */}
            <img
              src="/kyu_logo.png"
              alt="KYU Crest"
              style={{ display: 'block', margin: '0 auto 5px', width: '52px', height: '52px', objectFit: 'contain' }}
            />

            <div style={{ fontSize: '19px', fontWeight: '900', letterSpacing: '2.5px', fontFamily: cardFont }}>
              {cardSettings?.institution_name || 'KYAMBOGO UNIVERSITY'}
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1.5px', marginTop: '2px', fontFamily: cardFont }}>
              {profile?.person_type === 'staff'
                ? (cardSettings?.card_title || 'STUDENT MEDICAL CARD').replace('STUDENT', 'STAFF')
                : (cardSettings?.card_title || 'STUDENT MEDICAL CARD')} {academicYear()}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: `1.5px solid ${color.border}`, marginBottom: '10px', opacity: 0.5 }} />

          {/* ── Body: fields left, photo right ── */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

            {/* Fields */}
            <div style={{ flex: 1, lineHeight: '1.95', fontSize: '12px', fontFamily: cardFont }}>

              <Row label="Name" value={fullName} />

              {/* Sex and Age on same line */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <Row label="Sex" value={sex} style={{ flex: '0 0 auto' }} />
                <Row label="Age" value={age != null ? String(age) : null} style={{ flex: '0 0 auto' }} />
              </div>

              {/* Card No and Contact on same line */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <Row label="Card No"  value={profile?.medical_card_no} style={{ flex: '0 0 auto' }} />
                <Row label="Contact"  value={profile?.phone || profile?.contact} style={{ flex: 1 }} />
              </div>

              <Row label="Reg. No" value={profile?.reg_no || profile?.student_no || profile?.staff_number} />

              {/* Year of Entry and Expiry on same line */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <Row label="Year of Entry" value={profile?.year_of_entry ? String(profile.year_of_entry) : null} style={{ flex: '0 0 auto' }} />
                <Row label="Expiry"        value={expiry} style={{ flex: '0 0 auto' }} />
              </div>

              {/* Signature — always dotted since it's blank */}
              <Row label="DCHS' Signature" value={null} />
            </div>

            {/* Passport photo */}
            <div style={{
              width:          '88px',
              height:         '108px',
              border:         `2px solid ${color.border}`,
              borderRadius:   '3px',
              flexShrink:     0,
              overflow:       'hidden',
              background:     `${color.border}10`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              marginTop:      '2px',
            }}>
              {photoUrl ? (
                <img src={photoUrl} alt="Passport" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '8px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color.border}
                    strokeWidth="1.2" style={{ display: 'block', margin: '0 auto 5px', opacity: 0.45 }}>
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  <div style={{ fontSize: '8px', color: color.border, opacity: 0.55, lineHeight: 1.4, fontFamily: 'sans-serif' }}>
                    PASSPORT<br/>PHOTO
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        {photoUrl
          ? 'Photo saved to your account. It appears here and on the printed card.'
          : 'Upload your passport photo — it will be saved to your account and shown on the card.'}
      </p>
    </div>
  )
}
