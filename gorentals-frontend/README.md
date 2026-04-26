# GoRentals Frontend

A modern, high-performance platform for renting and managing items. Built with [Next.js](https://nextjs.org) for a premium experience.

## Getting Started

First, ensure your backend server (Java/Spring Boot) is running, then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Core Features

- **Dynamic Marketplace**: Browse and search listings with high-fidelity UI.
- **Role-Based Control**: Dedicated dashboards for Admins, Owners, and Renters.
- **Secure Authentication**: Robust JWT-based session management with auto-sync.
- **Rich Aesthetics**: Premium design language with smooth transitions and responsive layouts.

## Technical Details

- **Framework**: Next.js 16+ (Turbopack)
- **Styling**: Vanilla CSS with modern flexbox/grid
- **State Management**: React Context + custom hooks
- **API Communication**: Axios with centralized interceptors

## Local Development

All external cloud connections (Vercel, Supabase) have been detached. The project is configured for 100% local development.
- Storage: Mocked storage service (local fallback).
- API: Points to `http://localhost:8080/api`.

---
Developed as part of the GoRentals ecosystem.
