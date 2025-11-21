'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function MatchingResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job');

  const [matches, setMatches] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [totalMatches, setTotalMatches] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      fetchMatches();
    }
  }, [jobId]);

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/${jobId}/matches`);
      const data = await response.json();

      if (data.success) {
        setMatches(data.data.matches || []);
        setJobTitle(data.data.job_title || '');
        setTotalMatches(data.data.total_matches || 0);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = (cvId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to unlock candidate details');
      router.push('/employer/login');
      return;
    }
    router.push(`/payment?cv=${cvId}&job=${jobId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-full max-w-[1200px] flex-1">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/20 dark:border-primary/40 px-4 py-4">
              <div className="flex items-center gap-4 text-black dark:text-white">
                <div className="size-6">
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_6_330)">
                      <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" fillRule="evenodd"></path>
                    </g>
                  </svg>
                </div>
                <h2 className="text-black dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                  RecruitFlow
                </h2>
              </div>
            </header>

            <main className="flex flex-col gap-8 py-8">
              {/* Page Title */}
              <div className="flex flex-wrap items-center justify-between gap-4 px-4">
                <h1 className="text-black dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                  Found {totalMatches} matches for your job posting
                </h1>
                <button
                  onClick={() => router.push('/')}
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-black dark:text-white border border-primary/50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Search Again
                </button>
              </div>

              {/* Matches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {matches.map((match) => (
                  <div
                    key={match.cv_id}
                    className="flex flex-col gap-4 rounded-lg border border-primary/20 dark:border-primary/40 p-6 hover:border-primary/40 dark:hover:border-primary/60"
                  >
                    <div>
                      <h3 className="text-black dark:text-white text-xl font-bold leading-normal">
                        {match.candidate_name || `Candidate #${match.cv_id}`}
                      </h3>
                      <p className="text-black/60 dark:text-white/60 text-base font-normal leading-normal">
                        {match.current_role || 'Professional'}
                      </p>
                    </div>

                    {/* Match Score */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between">
                        <p className="text-black dark:text-white text-sm font-medium leading-normal">
                          {match.match_percentage}% Match
                        </p>
                      </div>
                      <div className="w-full rounded bg-black/10 dark:bg-white/10">
                        <div
                          className="h-2 rounded bg-primary"
                          style={{ width: `${match.match_percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex gap-2 flex-wrap">
                      {match.skills?.slice(0, 3).map((skill, idx) => (
                        <div
                          key={idx}
                          className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded border border-primary/20 dark:border-primary/40 px-3"
                        >
                          <p className="text-black/80 dark:text-white/80 text-sm font-medium leading-normal">
                            {skill}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Experience */}
                    {match.experience_years && (
                      <p className="text-sm text-black/60 dark:text-white/60">
                        {match.experience_years} years experience
                      </p>
                    )}

                    {/* Unlock Button */}
                    <button
                      onClick={() => handleUnlock(match.cv_id)}
                      className="flex mt-2 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-black text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90"
                    >
                      Unlock Contact
                    </button>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {matches.length < totalMatches && (
                <div className="flex justify-center p-4">
                  <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-black dark:text-white border border-primary/50 text-sm font-bold leading-normal tracking-[0.015em] hover:bg-black/5 dark:hover:bg-white/5">
                    Load More Results
                  </button>
                </div>
              )}

              {/* Sign Up CTA */}
              <div className="mx-4 p-6 rounded-lg border border-primary/20 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 text-center">
                <h3 className="text-black dark:text-white text-xl font-bold mb-2">
                  Want to see full contact details?
                </h3>
                <p className="text-black/60 dark:text-white/60 mb-4">
                  Sign up to unlock candidate information and download CVs
                </p>
                <button
                  onClick={() => router.push('/employer/login')}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg h-12 px-6 bg-primary text-black text-base font-bold hover:bg-primary/90"
                >
                  Sign Up Now
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}