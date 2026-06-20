# Medipost AI Studio

AI-powered healthcare content creation platform for doctors, clinics, hospitals, and healthcare professionals.

## Features

* Single Post Generator
* Carousel Post Generator
* Story Content Generator
* Reel Script Generator
* Awareness Campaign Generator
* Festive Wishes Generator
* Brand Kit Management

  * Clinic Logo Upload
  * Doctor Photo Upload
  * Clinic Photo Upload
  * Cover Image Upload
  * Brand Color Configuration
* Responsive Healthcare Content Studio
* Live Content Preview

## Tech Stack

### Frontend

* React 19
* TypeScript
* Vite
* TanStack Router
* TanStack Query
* Tailwind CSS
* Radix UI
* Lucide Icons

### Development Tools

* Node.js
* npm

## Prerequisites

Install the following before running the project:

* Node.js (v18 or later recommended)
* npm

Verify installation:

```bash
node -v
npm -v
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project folder:

```bash
cd medipost-ai-studio
```

Install dependencies:

```bash
npm install
```

## Running Locally

Start the development server:

```bash
npm run dev
```

Open the URL displayed in the terminal, typically:

```text
http://localhost:5173
```

## Build for Production

Generate production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project Structure

```text
src/
├── components/
├── routes/
├── lib/
├── hooks/
├── styles/
├── assets/
└── main.tsx
```

(Note: Structure may evolve as the project grows.)

## Current Status

This repository currently contains the frontend MVP prototype.

Implemented:

* Content Studio UI
* Multiple Content Formats
* Brand Kit Interface
* Theme Selection
* Layout Controls
* Content Preview

Planned:

* User Authentication
* Backend APIs
* Database Integration
* Gemini AI Integration
* Content History
* Subscription Management
* Admin Dashboard
* Export & Download Features
* Social Media Publishing Integrations

## Environment Variables

When backend integrations are added, create:

```env
VITE_GEMINI_API_KEY=your_api_key
```

Additional environment variables will be documented as features are implemented.

## Notes

This project was initially prototyped using Lovable and is now maintained locally for continued development and backend integration.

## License

Internal Project / Proprietary

```
```
