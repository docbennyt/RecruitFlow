import { useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [jobDescription, setJobDescription] = useState('')

  const handleScanMatches = async () => {
    // Implementation for scanning matches
    console.log('Scanning matches for:', jobDescription)
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      <Head>
        <title>RecruitFlow - CV Matching Tool</title>
      </Head>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 px-6 sm:px-10 py-3">
        <div className="flex items-center gap-4 text-black dark:text-white">
          <div className="size-6 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <h2 className="text-lg font-bold">RecruitFlow</h2>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <button className="flex items-center justify-center rounded-lg h-10 w-10 border border-gray-300 dark:border-gray-700">
            <span className="material-symbols-outlined">toggle_off</span>
          </button>
          <button className="flex items-center justify-center rounded-lg h-10 w-10 border border-gray-300 dark:border-gray-700">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="bg-gray-300 dark:bg-gray-700 rounded-full size-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center flex-1 py-10 sm:py-20 text-center">
        <div className="w-full max-w-2xl px-4 py-3">
          <h1 className="text-3xl sm:text-4xl font-black text-black dark:text-white">
            Paste your job description below and find matching candidates instantly
          </h1>
        </div>

        <div className="w-full max-w-2xl px-4 py-3">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full min-h-48 sm:min-h-60 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white p-4 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="e.g., Senior Software Engineer, 5+ years experience in Python, Django, AWS..."
          />
        </div>

        <div className="px-4 py-3">
          <button
            onClick={handleScanMatches}
            className="w-full max-w-md h-12 px-5 border-2 border-black dark:border-white text-black dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 font-bold"
          >
            Scan & Find Matches
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 dark:border-gray-700 px-5 py-10 text-center">
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          <a href="#" className="text-gray-600 dark:text-gray-400">Help</a>
          <a href="#" className="text-gray-600 dark:text-gray-400">Terms of Service</a>
        </div>
        <p className="text-gray-600 dark:text-gray-400">© 2024 RecruitFlow</p>
      </footer>
    </div>
  )
}