# Hustl Landing Page

A premium, cinematic landing page for Hustl - the Tinder-style job portal for students.

## 🎨 Design Features

### Visual Design
- **Black background with white text** throughout for maximum contrast
- **Space Mono font** (monospace) for all text elements
- **Full-viewport video backgrounds** on all major sections
- **Custom 4-fold rotationally symmetric logo**
- **Dot grid overlay** with subtle opacity for texture
- **Large background watermark text** using Anton SC font

### Animations & Interactions
- **Mouse-scrubbed hero video** - horizontal mouse movement controls video timeline
- **ScrambleIn text animation** - characters reveal with scramble effect
- **ScrambleText hover animation** - text scrambles on hover
- **3D rotating text** - scroll-based perspective transformation
- **Animated hamburger menu** - spring physics transitions
- **Custom cursor** - follows mouse with scale on hover
- **Loading screen** - rotating logo with pulsing dots
- **Swipe indicator** - guides users to interact with hero video

### Sections

1. **Hero Section**
   - Mouse-scrubbed video background
   - "Swipe Your Way To Success" headline with scramble animations
   - Dot grid overlay
   - "OPPORTUNITY" watermark text

2. **Cinematic Text Section**
   - Autoplay looping video
   - 3D perspective text that rotates on scroll
   - Describes Hustl's value proposition

3. **Metrics Section**
   - Performance statistics
   - 10k+ Active Students
   - 500+ Partner Businesses
   - 95% Match Success Rate

4. **Technology Section**
   - Smart Matching features
   - 4-column feature grid
   - Location First, Schedule Sync, Skill Match, Instant Chat

5. **Architecture Section**
   - Pure black background (no video)
   - Three-step process explanation
   - Minimalist card design

6. **Footer**
   - Video background
   - Company information
   - Copyright notice

### Navigation
- **Fixed navbar** with glassmorphism effect
- **Expanding menu pill** - animates from 48px to 290px
- **Logo pill** - hides on mobile when menu is open
- **Download button** - Apple icon with scramble text
- **Responsive design** - different layouts for mobile and desktop

## 🛠️ Technical Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Google Fonts** - Space Mono & Anton SC
- **Bootstrap Icons** - for Apple icon
- **CloudFront CDN** - for video delivery

## 📦 Installation

```bash
cd apps/synapsex
npm install
npm run dev
```

The site will be available at `http://localhost:3001`

## 🎯 Key Features

### Performance
- Preconnect to external domains for faster loading
- DNS prefetch for CDN resources
- Optimized video loading
- Smooth scroll with spring physics

### SEO
- Complete meta tags (title, description, keywords)
- Open Graph tags for social sharing
- Twitter Card tags
- Structured data (JSON-LD)
- Semantic HTML

### Accessibility
- Proper heading hierarchy
- Alt text for images
- ARIA labels where needed
- Keyboard navigation support
- Focus states on interactive elements

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly tap targets
- Optimized for all screen sizes

## 🎨 Brand Colors

- **Primary Background**: `#000000` (Pure Black)
- **Primary Text**: `#FFFFFF` (Pure White)
- **Accent Purple**: `#8E7F94` (Watermark text)
- **Overlay**: `rgba(255,255,255,0.15)` (Glassmorphism)

## 📝 Content Strategy

All content is tailored for Hustl's target audience:
- **Students** seeking flexible part-time work
- **Businesses** looking for student talent
- **Campus-focused** job matching
- **Instant matching** like Tinder
- **No resumes required** - swipe-based interface

## 🚀 Deployment

The site is optimized for deployment on:
- Vercel
- Netlify
- AWS Amplify
- Any static hosting service

## 📄 License

© 2026 Hustl Labs. All rights reserved.

## 🤝 Contributing

This is a proprietary project. For questions or contributions, contact the Hustl team.

---

**Built with precision and attention to detail.**
