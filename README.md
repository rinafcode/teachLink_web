### 🌐 `web/README.md`

# 📚 TeachLink Frontend

![Frontend CI](https://github.com/teachlink/frontend/actions/workflows/ci.yml/badge.svg)

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

| Layer      | Technology               |
| ---------- | ------------------------ |
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

```
