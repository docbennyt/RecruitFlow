import { useState } from 'react'
import Head from 'next/head'

const candidates = [
  {
    id: 1,
    name: "Eleanor Vance",
    role: "Senior Product Manager",
    match: 94,
    skills: ["Product Strategy", "Agile Methodologies", "UX Research"],
    contactUnlocked: false
  },
  {
    id: 2,
    name: "Candidate #5678",
    role: "Lead UX Designer", 
    match: 91,
    skills: ["Figma", "User Testing", "Design Systems"],
    contactUnlocked: false
  }
]

export default function MatchingResults() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      <Head>
        <title>RecruitFlow - Matching Results</title>
      </Head>

      <header className="flex items-center justify-between border-b border-primary/20 dark:border-primary/40 px-4 py-4">
        <div className="flex items-center gap-4 text-black dark:text-white">
          <div className="size-6">
            {/* Logo SVG */}
          </div>
          <h2 className="text-xl font-bold">RecruitFlow</h2>
        </div>
      </header>

      <main className="py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-black dark:text-white min-w-72">
            Found 24 matches for your job posting
          </h1>
          <button className="h-10 px-4 border border-primary/50 text-black dark:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            Search Again
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {candidates.map(candidate => (
            <div key={candidate.id} className="border border-primary/20 dark:border-primary/40 rounded-lg p-6 hover:border-primary/40 dark:hover:border-primary/60">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-black dark:text-white">{candidate.name}</h3>
                <p className="text-black/60 dark:text-white/60">{candidate.role}</p>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">{candidate.match}% Match</p>
                </div>
                <div className="w-full rounded bg-black/10 dark:bg-white/10">
                  <div 
                    className="h-2 rounded bg-primary" 
                    style={{ width: `${candidate.match}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {candidate.skills.map(skill => (
                  <div key={skill} className="h-8 border border-primary/20 dark:border-primary/40 px-3 rounded flex items-center">
                    <p className="text-sm font-medium text-black/80 dark:text-white/80">{skill}</p>
                  </div>
                ))}
              </div>

              <button className="w-full h-10 bg-primary text-white rounded-lg hover:bg-black/80 dark:hover:bg-white/90 dark:text-black font-bold">
                Unlock Contact
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-center p-4">
          <button className="h-10 px-4 border border-primary/50 text-black dark:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            Load More Results
          </button>
        </div>
      </main>
    </div>
  )
}