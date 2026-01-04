# SkillRoute Frontend

React-based frontend for the SkillRoute career navigation platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file from `.env.example` and add your Firebase credentials:
```bash
cp .env.example .env.local
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

- User authentication with Firebase
- Profile management
- AI-powered career roadmap generation
- Responsive design with Tailwind CSS

## Tech Stack

- React 18
- Vite
- React Router
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS
- Axios

## Project Structure

```
src/
├── firebase.js          # Firebase configuration
├── main.jsx            # Application entry point
├── App.jsx             # Main app component with routing
├── pages/
│   ├── Login.jsx       # Login/signup page
│   └── Dashboard.jsx   # Main dashboard
├── components/
│   ├── ProfileForm.jsx # User profile form
│   └── RoadmapView.jsx # Career roadmap display
└── styles/
    └── index.css       # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
