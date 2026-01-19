import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to Teachlink Web
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            **TeachLink** is a decentralized platform built for technocrats to **share, analyze, and monetize knowledge** through collaborative content, blockchain-based tipping, and gamified reputation. This repository contains the frontend codebase built with **Next.js (App Router)**, **Tailwind CSS**, and integrated with **Starknet** for seamless Web3 interactions.
          </p>
        </div>
        
      </main>
    </div>
  );
}
