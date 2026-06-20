'use client';
import { useState } from 'react';

const FURNISHING_OPTS = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const PREF_OPTS = ['Any', 'Family', 'Bachelor', 'Female Only', 'Male Only', 'Student'];
const FACING_OPTS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
const CAT_OPTS = [
  { value: 'rent', label: 'Rent' },
  { value: 'buy', label: 'Buy/Sale' },
  { value: 'sublet', label: 'Sublet' },
  { value: 'student', label: 'Student Housing' },
  { value: 'room', label: 'Room' },
  { value: 'office', label: 'Office' },
];

interface Props {
  listing: {
    id: number;
    title: string;
    area: string;
    cat: string;
    price: number;
    beds: number;
    baths: number;
    size: number;
    floor: string;
    furnishing: string;
    pref: string;
    advance: number;
    service: number;
    description: string | null;
    amenities: string[];
    landmark: string | null;
    facing: string | null;
    totalFloors: string | null;
    balconies: number | null;
    verified: boolean;
    sale: boolean;
    featured: boolean;
  };
}

type Status = 'active' | 'pending' | 'rented';

interface Errors {
  price?: string;
  title?: string;
}

export default function EditListingForm({ listing }: Props) {
  const initStatus: Status = listing.verified ? 'active' : listing.sale ? 'rented' : 'pending';
  const [status, setStatus] = useState<Status>(initStatus);
  const [featured, setFeatured] = useState(listing.featured);
  const [amenitiesStr, setAmenitiesStr] = useState((listing.amenities ?? []).join(', '));
  const [errors, setErrors] = useState<Errors>({});

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 46, border: '1px solid #E2E7EE', borderRadius: 12,
    padding: '0 14px', fontFamily: 'inherit', fontSize: 14, color: '#15243B', outline: 'none',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: 'pointer', background: '#fff',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12.5, fontWeight: 700, color: '#4A5161', marginBottom: 7,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 12, color: '#B4402B', marginTop: 5,
  };

  const statusOpts: { label: string; value: Status }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Rented', value: 'rented' },
  ];

  function validate(fd: FormData): boolean {
    const errs: Errors = {};
    const title = fd.get('title') as string;
    const price = parseInt(fd.get('price') as string);
    if (!title?.trim()) errs.title = 'Title is required';
    if (!price || price <= 0) errs.price = 'Price must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    if (!validate(fd)) {
      e.preventDefault();
    }
  }

  return (
    <form action="/api/admin/listings" method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={listing.id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="featured" value={featured ? '1' : '0'} />
      <input type="hidden" name="amenities" value={amenitiesStr} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Basic info ── */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Basic info</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'block' }}>
              <span style={labelStyle}>Listing title <span style={{ color: '#B4402B' }}>*</span></span>
              <input name="title" defaultValue={listing.title} style={{ ...inputStyle, borderColor: errors.title ? '#F0D9D2' : '#E2E7EE' }} />
              {errors.title && <div style={errorStyle}>{errors.title}</div>}
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Area / Neighbourhood</span>
                <input name="area" defaultValue={listing.area} style={inputStyle} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Landmark / Address</span>
                <input name="landmark" defaultValue={listing.landmark ?? ''} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Category</span>
                <select name="cat" defaultValue={listing.cat} style={selectStyle}>
                  {CAT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Preferred tenant</span>
                <select name="pref" defaultValue={listing.pref} style={selectStyle}>
                  {PREF_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Pricing</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <label style={{ display: 'block' }}>
              <span style={labelStyle}>Price (৳) <span style={{ color: '#B4402B' }}>*</span></span>
              <input name="price" defaultValue={listing.price} type="number" min={1} style={{ ...inputStyle, borderColor: errors.price ? '#F0D9D2' : '#E2E7EE' }} />
              {errors.price && <div style={errorStyle}>{errors.price}</div>}
            </label>
            <label style={{ display: 'block' }}>
              <span style={labelStyle}>Advance (months)</span>
              <input name="advance" defaultValue={listing.advance} type="number" min={0} style={inputStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <span style={labelStyle}>Service charge (৳/mo)</span>
              <input name="service" defaultValue={listing.service} type="number" min={0} style={inputStyle} />
            </label>
          </div>
        </section>

        {/* ── Property details ── */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Property details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Bedrooms</span>
                <input name="beds" defaultValue={listing.beds} type="number" min={0} style={inputStyle} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Bathrooms</span>
                <input name="baths" defaultValue={listing.baths} type="number" min={0} style={inputStyle} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Size (sqft)</span>
                <input name="size" defaultValue={listing.size} type="number" min={0} style={inputStyle} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Floor</span>
                <input name="floor" defaultValue={listing.floor} style={inputStyle} placeholder="e.g. 3rd" />
              </label>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Total floors</span>
                <input name="totalFloors" defaultValue={listing.totalFloors ?? ''} style={inputStyle} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Balconies</span>
                <input name="balconies" defaultValue={listing.balconies ?? 0} type="number" min={0} style={inputStyle} />
              </label>
              <label style={{ display: 'block' }}>
                <span style={labelStyle}>Facing</span>
                <select name="facing" defaultValue={listing.facing ?? ''} style={selectStyle}>
                  <option value="">—</option>
                  {FACING_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            </div>

            <label style={{ display: 'block' }}>
              <span style={labelStyle}>Furnishing</span>
              <select name="furnishing" defaultValue={listing.furnishing} style={selectStyle}>
                {FURNISHING_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* ── Amenities ── */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9AA6B6', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 14 }}>Amenities</div>
          <label style={{ display: 'block' }}>
            <span style={labelStyle}>Amenities (comma-separated)</span>
            <input
              value={amenitiesStr}
              onChange={e => setAmenitiesStr(e.target.value)}
              style={inputStyle}
              placeholder="e.g. Lift, Parking, Generator, CCTV"
            />
          </label>
          {amenitiesStr.trim() && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {amenitiesStr.split(',').map(a => a.trim()).filter(Boolean).map((a, i) => (
                <span key={i} style={{ background: '#EEF3F8', color: '#1E3A5C', fontSize: 12.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>{a}</span>
              ))}
            </div>
          )}
        </section>

        {/* ── Description ── */}
        <label style={{ display: 'block' }}>
          <span style={labelStyle}>Description</span>
          <textarea
            name="description"
            defaultValue={listing.description ?? ''}
            style={{
              width: '100%', minHeight: 110, border: '1px solid #E2E7EE', borderRadius: 12,
              padding: '12px 14px', fontFamily: 'inherit', fontSize: 14, color: '#15243B',
              resize: 'vertical', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box',
            }}
          />
        </label>

        {/* ── Status ── */}
        <div>
          <span style={labelStyle}>Status</span>
          <div style={{ display: 'flex', gap: 9 }}>
            {statusOpts.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setStatus(o.value)}
                className="bv-press"
                style={{
                  padding: '9px 16px', borderRadius: 11,
                  border: status === o.value ? '1.5px solid #1E3A5C' : '1.5px solid #E2E7EE',
                  background: status === o.value ? '#EEF3F8' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                  color: status === o.value ? '#1E3A5C' : '#8893A4',
                  transition: 'all 0.15s',
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Featured toggle ── */}
        <div
          onClick={() => setFeatured(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: featured ? '#FAF6EC' : '#FAFBFC',
            border: featured ? '1px solid #EFE6CF' : '1px solid #E2E7EE',
            borderRadius: 13, padding: '15px 18px',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#15243B' }}>★ Featured listing</div>
            <div style={{ fontSize: 12.5, color: '#8893A4', marginTop: 2 }}>
              Boosts this property to the top of search results.
            </div>
          </div>
          <div style={{
            width: 46, height: 27, borderRadius: 999,
            background: featured ? '#2E7D55' : '#E2E7EE',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <span style={{
              position: 'absolute', top: 2.5,
              left: featured ? 21 : 3,
              width: 22, height: 22, borderRadius: '50%',
              background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,.25)',
              transition: 'left 0.2s',
            }} />
          </div>
        </div>

      </div>

      <div style={{
        display: 'flex', gap: 12, marginTop: 26,
        paddingTop: 22, borderTop: '1px solid #EEF1F5',
      }}>
        <button type="submit" className="bv-press" style={{
          height: 46, padding: '0 26px', borderRadius: 13, border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700,
          color: '#fff', background: '#2E7D55',
          boxShadow: '0 12px 24px -10px rgba(46,125,85,.6)',
        }}>
          Save changes
        </button>
        <a href={`/listings/${listing.id}`} style={{ textDecoration: 'none' }}>
          <button type="button" className="bv-press bv-fill" style={{
            '--fill': '#EEF2F7', height: 46, padding: '0 22px', borderRadius: 13,
            border: '1px solid #E2E7EE', background: '#fff', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#44506A',
          } as React.CSSProperties}>
            Cancel
          </button>
        </a>
      </div>
    </form>
  );
}
