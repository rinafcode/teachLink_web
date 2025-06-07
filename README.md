
### 🌐 `web/README.md`

# 📚 TeachLink Frontend

**TeachLink** is a decentralized platform built for technocrats to **share, analyze, and monetize knowledge** through collaborative content, blockchain-based tipping, and gamified reputation. This repository contains the frontend codebase built with **Next.js (App Router)**, **Tailwind CSS**, and integrated with **Starknet** for seamless Web3 interactions.

---

## 🚀 Project Overview

TeachLink empowers users to:

- 📢 Share knowledge, tutorials, or insights  
- 🧠 Engage in discussions and collaborative learning  
- 💸 Earn through on-chain tipping  
- 🔗 Build reputation with verifiable Web3 credentials  

This frontend serves as the main user interface for interacting with TeachLink's decentralized knowledge ecosystem. It supports wallet-based login, markdown post creation, tipping, theming, user profiles, and topic feeds—all while maintaining a seamless Web2.5 user experience.

---

## 🧱 Tech Stack

| Layer       | Technology               |
|------------|--------------------------|
| Framework  | Next.js (App Router)     |
| Styling    | Tailwind CSS             |
| Web3       | Starknet.js, StarknetKit |
| State Mgmt | React Context / Hooks    |
| Markdown   | React Markdown + Remark  |
| Theming    | `next-themes`            |
| Indexing   | Apibara (backend)        |
| Wallets    | Argent X, Braavos        |

---

## ⚙️ Features

- 🔐 **Starknet Wallet Integration** – Login and interact using Starknet-compatible wallets  
- 🧾 **Markdown-Based Post Editor** – Rich, previewable post creation using markdown  
- 💡 **Tipping System** – Send and receive on-chain tips via smart contracts  
- 🌙 **Dark/Light Theme Toggle** – Accessible theming using Tailwind CSS  
- 🔎 **Dynamic Routing with App Router** – Clean, scalable navigation  
- 📂 **Profile and Topic Pages** – View user-specific content and explore topic-specific posts  
- 📱 **Responsive Layout** – Fully mobile-ready with modular components  

---

## 📁 Directory Structure (Highlights)

/app
/create → Post creation page
/post/[id] → View individual post
/profile/[user] → User profile
/topics/[slug] → Topic feed
/components
Navbar.tsx → Top navigation bar
Sidebar.tsx → Side navigation
Editor.tsx → Markdown post editor
WalletProvider.tsx → Wallet connection logic
/styles
globals.css → Tailwind directives

---

## 🛠 Setup Instructions

1. **Clone the repo**
```bash
git clone https://github.com/teachlink/frontend.git
cd frontend
Install dependencies

bash
Copy
Edit
npm install
Set up environment variables
Create a .env.local with:

ini
Copy
Edit
NEXT_PUBLIC_STARKNET_NETWORK=testnet
NEXT_PUBLIC_INDEXER_API_URL=https://indexer.teachlink.xyz
NEXT_PUBLIC_API_URL=your-api-url
Run the development server

bash
Copy
Edit
npm run dev
🏗️ Development Milestones
✅ Tailwind CSS Integration

✅ App Router setup with nested layouts

✅ Wallet connection via StarknetKit

✅ Theme toggle and persistence

✅ Markdown editor with live preview

🚧 Topic and profile page rendering

🚧 DAO & governance integration post-launch

For detailed tasks, see GitHub Issues

🤝 Contributing
We welcome community contributions!

Guidelines:
Fork the repo and make your changes in a feature branch

Before submitting a PR, read the CONTRIBUTING.md file

## 📬 Join the Community

- [Telegram](t.me/teachlinkOD)
Join our Telegram group for discussions and support

Make sure your PR references the correct issue:
Example: Close #3

✅ Acceptance Criteria for PRs
Feature must align with roadmap/issue description

Must include working UI with no console errors

Must use lucide icons for consistent usage throughout the app

Must use Starknet best practices for wallet/contract interactions

Use Tailwind CSS with responsive design

PR title should be clear and reference issue number

✅ Outcome: A scalable, token-driven learning platform where creators monetize knowledge, learners access premium content, and all users interact securely — powered by Web2 + Web3.

let make our code clean, maintainable and scallable. Keep to Standard

📜 License
MIT © 2025 TeachLink DAO

# Frontend Authentication System

This folder contains an enhanced authentication system built with React, Vite, and framer-motion animations.

## Features

- **Animated Login & Signup Pages** with smooth transitions
- **Enhanced Form Validation** using react-hook-form + zod
- **Responsive Design** with Tailwind CSS
- **Reusable Components** with built-in animations
- **TypeScript Support** with strict type checking

## Components

### Pages
- `LoginPage` - Animated login page with form validation
- `SignupPage` - Animated signup page with password confirmation

### Components
- `AuthLayout` - Animated layout wrapper with background effects
- `AuthCard` - Card component with hover animations
- `FormInput` - Enhanced input with focus animations and error handling
- `AnimatedButton` - Button with loading states and hover effects
- `LoginForm` - Login form with validation
- `SignupForm` - Signup form with enhanced validation

### Validation
- `validationSchemas.ts` - Zod schemas for form validation
- Email format validation
- Password strength requirements
- Password confirmation matching

## Usage

```tsx
import { LoginPage, SignupPage } from '@/frontendauth';

// Use in your routing
<Route path="/frontend-auth/login" element={<LoginPage />} />
<Route path="/frontend-auth/signup" element={<SignupPage />} />
```

## Animations

- **Page transitions** - Fade and slide animations on mount
- **Form elements** - Staggered entrance animations
- **Input focus** - Scale and border color transitions
- **Button interactions** - Hover and loading state animations
- **Error messages** - Smooth slide-in error displays
- **Background effects** - Subtle rotating gradient orbs

## Validation Rules

### Login
- Email: Required, valid email format
- Password: Required, minimum 6 characters

### Signup
- Name: Required, 2-50 characters
- Email: Required, valid email format
- Password: Required, minimum 8 characters, must contain uppercase, lowercase, and number
- Confirm Password: Must match password

## Mock API Integration

Forms are set up to work with mock API endpoints:
- Login: `/api/auth/login`
- Signup: `/api/auth/signup`

Success and error states are handled with toast notifications.


