# Features Section Bento Grid Redesign Plan

## Overview
Redesign Features section "Fitur Aktual" menggunakan Bento Grid layout yang asimetris dan modern dengan 4 kartu fitur utama.

## Design System

### Color Palette (Blue Tone)
- **Primary Blue**: `#2563eb` (blue-600) - Tombol & aksen utama
- **Light Blue**: `#dbeafe` (blue-50) - Highlight & background
- **Indigo**: `#4f46e5` (indigo-500) - Aksen alternatif
- **Text Dark**: `#1e293b` (slate-800) - Heading
- **Text Medium**: `#64748b` (slate-500) - Paragraf
- **Background**: `#f8fafc` (slate-50) - Canvas
- **Card Background**: `#ffffff` (white)

### Typography
- **Font Family**: Inter / Plus Jakarta Sans (sans-serif)
- **Badge**: 10px, uppercase, bold
- **Section Heading**: 28-36px, extrabold
- **Card Title**: 18-20px, bold
- **Card Description**: 14px, regular
- **Small Text**: 12-13px

### Spacing & Sizing
- **Border Radius**: `rounded-2xl` (16px) atau `rounded-3xl` (24px)
- **Shadow**: `shadow-sm` atau `shadow-md`
- **Padding**: Card padding `p-6` hingga `p-8`
- **Gap**: Grid gap `gap-4` hingga `gap-6`

## Bento Grid Structure

### Desktop Layout (lg breakpoint)
```
┌─────────────────────────────────────────────────┐
│  [Card 1: Profil Creator - HERO]  │ [Card 2]   │
│         (col-span-2, row-span-2)  │ Multi-     │
│                                    │ Platform   │
│                                    │            │
├────────────────────────────────────┼────────────┤
│  [Card 4: Halaman Video Publik]   │ [Card 3]   │
│         (col-span-2)               │ Kontrol    │
│                                    │ Visibilitas│
└────────────────────────────────────┴────────────┘
```

### Grid Configuration
- **Desktop**: `grid-cols-3` dengan kombinasi `col-span-2` dan `row-span-2`
- **Tablet**: `grid-cols-2` dengan penyesuaian span
- **Mobile**: `grid-cols-1` (stack vertikal)

## Card Designs

### Card 1: Profil Creator Publik (Hero Card)
**Size**: Large (col-span-2, row-span-2)
**Purpose**: Showcase profil creator yang rapi dan profesional

**Elements**:
1. **Cover Image**
   - Gradient background: `bg-gradient-to-br from-blue-500 to-indigo-600`
   - Height: `h-32` atau `h-40`
   - Rounded top: `rounded-t-2xl`

2. **Avatar/Foto Profil**
   - Size: `w-20 h-20` atau `w-24 h-24`
   - Rounded full: `rounded-full`
   - Border: `border-4 border-white`
   - Position: Absolute, overlapping cover (-mt-10)

3. **Nama Creator**
   - Font: `text-xl font-bold text-slate-800`
   - Margin top: `mt-12`

4. **Bio Singkat**
   - Font: `text-sm text-slate-500`
   - Max lines: 2-3 lines
   - Margin: `mt-2`

5. **Skills Badges**
   - Layout: Flex wrap `flex flex-wrap gap-2`
   - Style: `bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium`
   - Examples: "Premiere Pro", "Color Grading", "Motion Graphics"
   - Margin: `mt-4`

6. **Contact Button**
   - Style: `bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700`
   - Position: Bottom of card
   - Margin: `mt-6`

**Layout Structure**:
```tsx
<div className="col-span-2 row-span-2 bg-white rounded-2xl shadow-md overflow-hidden">
  {/* Cover */}
  <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600" />
  
  {/* Content */}
  <div className="p-6 relative">
    {/* Avatar */}
    <div className="absolute -top-10 left-6">
      <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-200" />
    </div>
    
    {/* Name & Bio */}
    <div className="mt-12">
      <h3>Creator Name</h3>
      <p>Bio text...</p>
    </div>
    
    {/* Skills */}
    <div className="flex flex-wrap gap-2 mt-4">
      <span>Premiere Pro</span>
      <span>Color Grading</span>
    </div>
    
    {/* Button */}
    <button className="mt-6">Contact Me</button>
  </div>
</div>
```

### Card 2: Sumber Video Multi-platform
**Size**: Medium (col-span-1, row-span-1)
**Purpose**: Menampilkan platform sumber video yang didukung

**Elements**:
1. **Header**
   - Icon: Upload atau Link icon
   - Title: "Import dari Mana Saja"
   - Font: `text-lg font-bold text-slate-800`

2. **Platform Icons Grid**
   - Layout: `grid grid-cols-3 gap-3` atau `flex flex-wrap gap-3`
   - Icon size: `w-10 h-10` atau `w-12 h-12`
   - Style: Rounded dengan background warna brand masing-masing
   - Hover: `hover:scale-110 transition-transform`
   - Platforms: YouTube, Google Drive, Instagram, Facebook, Vimeo

3. **Platform Icon Style**:
   - Container: `flex items-center justify-center w-12 h-12 rounded-xl`
   - Background: Light version of brand color
   - Icon color: Brand color

**Layout Structure**:
```tsx
<div className="bg-white rounded-2xl shadow-md p-6">
  {/* Header */}
  <div className="flex items-center gap-2 mb-4">
    <LinkIcon className="w-5 h-5 text-blue-600" />
    <h3 className="text-lg font-bold text-slate-800">Import dari Mana Saja</h3>
  </div>
  
  {/* Platform Icons */}
  <div className="grid grid-cols-3 gap-3">
    {platforms.map(platform => (
      <div 
        className="flex items-center justify-center w-full aspect-square rounded-xl hover:scale-110 transition-transform"
        style={{ backgroundColor: platform.lightBg }}
      >
        <PlatformIcon style={{ color: platform.brandColor }} />
      </div>
    ))}
  </div>
</div>
```

### Card 3: Kontrol Visibilitas
**Size**: Medium (col-span-1, row-span-1)
**Purpose**: Visualisasi UI untuk mengatur status privasi proyek

**Elements**:
1. **Header**
   - Icon: Eye atau Lock icon
   - Title: "Kontrol Visibilitas"
   - Font: `text-lg font-bold text-slate-800`

2. **Status Options**
   - Layout: Vertical stack `space-y-3`
   - Each option: Radio button atau visual indicator
   - Status types:
     - **Draft**: Gray (`bg-slate-100 text-slate-600`)
     - **Private**: Red (`bg-red-50 text-red-600`) with lock icon
     - **Semi-Private**: Yellow (`bg-yellow-50 text-yellow-600`)
     - **Public**: Blue/Green (`bg-blue-50 text-blue-600`)

3. **Status Item Style**:
   - Container: `flex items-center gap-3 p-3 rounded-lg border-2`
   - Active state: `border-blue-500 bg-blue-50`
   - Inactive state: `border-slate-200`

**Layout Structure**:
```tsx
<div className="bg-white rounded-2xl shadow-md p-6">
  {/* Header */}
  <div className="flex items-center gap-2 mb-4">
    <EyeIcon className="w-5 h-5 text-blue-600" />
    <h3 className="text-lg font-bold text-slate-800">Kontrol Visibilitas</h3>
  </div>
  
  {/* Status Options */}
  <div className="space-y-3">
    {statuses.map(status => (
      <div className={`flex items-center gap-3 p-3 rounded-lg border-2 ${status.active ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
        <div className={`w-4 h-4 rounded-full ${status.color}`} />
        <div className="flex-1">
          <p className="font-semibold text-sm">{status.label}</p>
        </div>
        {status.icon && <LockIcon className="w-4 h-4" />}
      </div>
    ))}
  </div>
</div>
```

### Card 4: Halaman Video Publik
**Size**: Wide (col-span-2, row-span-1)
**Purpose**: Showcase halaman video publik dengan URL slug

**Elements**:
1. **Header**
   - Title: "Halaman Publik per Slug"
   - Description: "Sajikan karyamu dengan profesional untuk dinilai klien."
   - Font: Title `text-lg font-bold`, Description `text-sm text-slate-500`

2. **Browser Mockup**
   - Browser bar: `bg-slate-100 rounded-t-lg p-2`
   - URL display: `text-xs text-slate-600 bg-white rounded px-3 py-1.5`
   - Example URL: "domain.com/v/documentary-film"

3. **Video Thumbnail**
   - Aspect ratio: 16:9
   - Background: Gradient atau placeholder image
   - Play button: Centered, blue circle with white play icon
   - Size: `w-16 h-16` dengan `bg-blue-600 rounded-full`

4. **Video Info** (Optional):
   - Title below thumbnail
   - View count atau duration

**Layout Structure**:
```tsx
<div className="col-span-2 bg-white rounded-2xl shadow-md p-6">
  {/* Header */}
  <div className="mb-4">
    <h3 className="text-lg font-bold text-slate-800">Halaman Publik per Slug</h3>
    <p className="text-sm text-slate-500 mt-1">Sajikan karyamu dengan profesional untuk dinilai klien.</p>
  </div>
  
  {/* Browser Mockup */}
  <div className="border border-slate-200 rounded-lg overflow-hidden">
    {/* Browser Bar */}
    <div className="bg-slate-100 p-2 flex items-center gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
      </div>
      <div className="flex-1 bg-white rounded px-3 py-1.5 text-xs text-slate-600">
        domain.com/v/documentary-film
      </div>
    </div>
    
    {/* Video Thumbnail */}
    <div className="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-300">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
          <PlayIcon className="w-8 h-8 text-white ml-1" />
        </div>
      </div>
    </div>
  </div>
</div>
```

## Responsive Behavior

### Mobile (< 640px)
```css
.grid {
  grid-template-columns: 1fr;
}
.col-span-2, .row-span-2 {
  grid-column: span 1;
  grid-row: span 1;
}
```
- Stack vertikal
- Card 1 (Hero) tetap lebih tinggi dengan `min-h-[400px]`
- Semua card full width

### Tablet (640px - 1024px)
```css
.grid {
  grid-template-columns: repeat(2, 1fr);
}
```
- Card 1: `col-span-2` (full width)
- Card 2 & 3: Side by side
- Card 4: `col-span-2` (full width)

### Desktop (>= 1024px)
```css
.grid {
  grid-template-columns: repeat(3, 1fr);
}
```
- Bento Grid asimetris seperti diagram di atas

## Implementation Structure

### Section Container
```tsx
<section className="relative bg-slate-50 py-12 sm:py-16 lg:py-20" id="features">
  <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
    {/* Header */}
    <div className="text-center mb-10">
      <Badge>Fitur Aktual</Badge>
      <h2>Fitur penting untuk creator video</h2>
      <p>Showreels fokus ke profil creator publik...</p>
    </div>
    
    {/* Bento Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <Card1 />
      <Card2 />
      <Card3 />
      <Card4 />
    </div>
  </div>
</section>
```

## Animation & Interactions

### Framer Motion Animations
1. **Stagger Children**: Cards muncul satu per satu
2. **Hover Effects**: 
   - Card scale: `whileHover={{ scale: 1.02 }}`
   - Shadow increase
   - Icon scale pada platform icons
3. **Initial State**: `opacity: 0, y: 20`
4. **Animate**: `opacity: 1, y: 0`
5. **Transition**: `duration: 0.4, delay: index * 0.1`

### Hover States
- **Cards**: Subtle lift dengan shadow increase
- **Buttons**: Color darken + scale
- **Platform Icons**: Scale 110%
- **Play Button**: Background darken

## Data Structure

### marketingFeatures Array
```typescript
const bentoFeatures = [
  {
    id: 'profile',
    type: 'hero',
    title: 'Profil Creator Publik',
    description: 'Tampilkan identitas profesional dengan cover, avatar, bio, dan skills',
    mockData: {
      name: 'Alex Johnson',
      bio: 'Professional video editor specializing in documentaries and commercials',
      skills: ['Premiere Pro', 'Color Grading', 'Motion Graphics', 'Sound Design'],
      coverGradient: 'from-blue-500 to-indigo-600'
    }
  },
  {
    id: 'platforms',
    type: 'medium',
    title: 'Import dari Mana Saja',
    description: 'Hubungkan karya dari platform utama',
    platforms: [
      { name: 'YouTube', icon: Youtube, brandColor: '#FF0000', lightBg: '#FFE5E5' },
      { name: 'Google Drive', icon: HardDrive, brandColor: '#4285F4', lightBg: '#E3F2FD' },
      { name: 'Instagram', icon: Instagram, brandColor: '#E4405F', lightBg: '#FCE4EC' },
      { name: 'Facebook', icon: Facebook, brandColor: '#1877F2', lightBg: '#E3F2FD' },
      { name: 'Vimeo', icon: Video, brandColor: '#1AB7EA', lightBg: '#E1F5FE' }
    ]
  },
  {
    id: 'visibility',
    type: 'medium',
    title: 'Kontrol Visibilitas',
    description: 'Atur status privasi setiap proyek',
    statuses: [
      { label: 'Draft', value: 'draft', color: 'bg-slate-100 text-slate-600', icon: null },
      { label: 'Private', value: 'private', color: 'bg-red-50 text-red-600', icon: 'lock' },
      { label: 'Semi-Private', value: 'semi-private', color: 'bg-yellow-50 text-yellow-600', icon: 'eye-off' },
      { label: 'Public', value: 'public', color: 'bg-blue-50 text-blue-600', icon: 'globe' }
    ]
  },
  {
    id: 'public-page',
    type: 'wide',
    title: 'Halaman Publik per Slug',
    description: 'Sajikan karyamu dengan profesional untuk dinilai klien',
    mockData: {
      url: 'showreels.id/v/documentary-film',
      thumbnailGradient: 'from-slate-200 to-slate-300'
    }
  }
];
```

## Icons Required
- `Upload` atau `Link` - Card 2 header
- `Eye` atau `Lock` - Card 3 header
- `Lock`, `EyeOff`, `Globe` - Card 3 status icons
- `Play` - Card 4 video thumbnail
- Platform icons: `Youtube`, `HardDrive`, `Instagram`, `Facebook`, `Video` (Vimeo)

## Implementation Checklist
- [ ] Update section background to `bg-slate-50`
- [ ] Create Bento Grid container with responsive classes
- [ ] Implement Card 1 (Hero) with cover, avatar, skills, button
- [ ] Implement Card 2 (Platforms) with icon grid
- [ ] Implement Card 3 (Visibility) with status options
- [ ] Implement Card 4 (Public Page) with browser mockup
- [ ] Add Framer Motion animations
- [ ] Add hover effects and transitions
- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Ensure accessibility (ARIA labels, keyboard navigation)
- [ ] Connect with i18n dictionary for multilingual support

## Expected Outcome
- Modern, visually appealing Bento Grid layout
- Clear visualization of 4 key features
- Responsive design that works on all devices
- Smooth animations and interactions
- Professional blue color scheme
- Modular code structure for easy backend integration
