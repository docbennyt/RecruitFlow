'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cvId = searchParams.get('cv');
  const paymentId = searchParams.get('payment_id');

  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cvId) {
      fetchCandidateDetails();
    }
  }, [cvId]);

  const fetchCandidateDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cvs/${cvId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setCandidate(data.data);
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast.error('Failed to load candidate details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cvs/${cvId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = candidate?.filename || 'cv.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CV downloaded successfully');
      } else {
        toast.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('An error occurred during download');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-300 dark:border-gray-700 px-4 sm:px-10 py-3">
              <div className="flex items-center gap-4 text-black dark:text-white">
                <div className="size-6 text-gray-600 dark:text-gray-400">
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_6_330)">
                      <path clipRule="evenodd" d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fillRule="evenodd"></path>
                    </g>
                    <defs>
                      <clipPath id="clip0_6_330"><rect fill="white" height="48" width="48"></rect></clipPath>
                    </defs>
                  </svg>
                </div>
                <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  RecruitFlow
                </h2>
              </div>
              <div className="flex flex-1 justify-end gap-2 sm:gap-4">
                <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 border border-gray-300 dark:border-gray-700 text-black dark:text-white">
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 border border-gray-300 dark:border-gray-700 text-black dark:text-white">
                  <span className="material-symbols-outlined">settings</span>
                </button>
                <div className="bg-gray-300 dark:bg-gray-700 bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"></div>
              </div>
            </header>

            <main className="flex flex-col flex-1 items-center px-4 py-10 sm:py-16 gap-8">
              {/* Success Icon & Message */}
              <div className="flex w-full max-w-lg flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                  <span className="material-symbols-outlined text-black text-[40px]">check</span>
                </div>
                <div className="flex w-full flex-col gap-3">
                  <p className="text-black dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    Payment Successful!
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
                    You have successfully unlocked the candidate's full contact details.
                  </p>
                </div>
              </div>

              {/* Candidate Information */}
              {candidate && (
                <div className="flex w-full max-w-lg flex-col gap-6 rounded-lg border border-gray-300 dark:border-gray-700 p-6">
                  <h2 className="text-black dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em]">
                    Candidate Information
                  </h2>
                  <div className="grid grid-cols-1">
                    <div className="grid grid-cols-[30%_1fr] sm:grid-cols-[20%_1fr] border-t border-t-gray-300 dark:border-t-gray-700 py-5 items-center">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Full Name</p>
                      <p className="text-black dark:text-white text-sm font-normal leading-normal">
                        {candidate.candidate_name || 'Not provided'}
                      </p>
                    </div>
                    <div className="grid grid-cols-[30%_1fr] sm:grid-cols-[20%_1fr] border-t border-t-gray-300 dark:border-t-gray-700 py-5 items-center">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Phone</p>
                      <p className="text-black dark:text-white text-sm font-normal leading-normal">
                        {candidate.candidate_phone || 'Not provided'}
                      </p>
                    </div>
                    <div className="grid grid-cols-[30%_1fr] sm:grid-cols-[20%_1fr] border-t border-t-gray-300 dark:border-t-gray-700 py-5 items-center">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Email</p>
                      <p className="text-black dark:text-white text-sm font-normal leading-normal">
                        {candidate.candidate_email || 'Not provided'}
                      </p>
                    </div>
                    <div className="grid grid-cols-[30%_1fr] sm:grid-cols-[20%_1fr] border-t border-t-gray-300 dark:border-t-gray-700 py-5 items-center">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Role</p>
                      <p className="text-black dark:text-white text-sm font-normal leading-normal">
                        {candidate.current_role || 'Not provided'}
                      </p>
                    </div>
                    <div className="grid grid-cols-[30%_1fr] sm:grid-cols-[20%_1fr] border-t border-t-gray-300 dark:border-t-gray-700 py-5 items-center">
                      <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal">Experience</p>
                      <p className="text-black dark:text-white text-sm font-normal leading-normal">
                        {candidate.experience_years ? `${candidate.experience_years} years` : 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/employer/cvs/${cvId}`)}
                    className="flex w-full max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 bg-black dark:bg-white text-white dark:text-black text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-800 dark:hover:bg-gray-200"
                  >
                    View Full CV
                  </button>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleDownload}
                      className="flex flex-1 max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark text-gray-600 dark:text-gray-400 text-sm font-bold leading-normal tracking-[0.015em] gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      Download CV
                    </button>
                    <button className="flex flex-1 max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-background-dark text-gray-600 dark:text-gray-400 text-sm font-bold leading-normal tracking-[0.015em] gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <span className="material-symbols-outlined text-[20px]">share</span>
                      Share
                    </button>
                  </div>
                </div>
              )}

              {/* Find More Button */}
              <div className="w-full max-w-lg pt-4">
                <button
                  onClick={() => router.push('/')}
                  className="flex w-full max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 bg-primary text-black text-base font-bold leading-normal tracking-[0.015em] px-2 gap-4 hover:bg-primary/90"
                >
                  Find More Candidates
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}