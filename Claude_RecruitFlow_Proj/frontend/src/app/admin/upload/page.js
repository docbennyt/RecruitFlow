'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminUploadPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cvs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addFilesToQueue(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFilesToQueue(files);
  };

  const addFilesToQueue = (files) => {
    const validFiles = files.filter(file => {
      const isValid = file.type === 'application/pdf' || 
                     file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (!isValid) {
        toast.error(`${file.name} is not a valid file type`);
      }
      return isValid;
    });

    const newQueue = validFiles.map(file => ({
      file,
      status: 'pending',
      progress: 0,
      id: Math.random().toString(36).substr(2, 9)
    }));

    setUploadQueue(prev => [...prev, ...newQueue]);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      // Update queue status
      setUploadQueue(prev => prev.map(item => ({
        ...item,
        status: 'uploading',
        progress: 50
      })));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cvs/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${data.data.length} CV(s) uploaded successfully`);
        
        // Update queue with results
        setUploadQueue(prev => prev.map(item => ({
          ...item,
          status: 'completed',
          progress: 100
        })));

        // Clear after a delay
        setTimeout(() => {
          setUploadQueue([]);
          setSelectedFiles([]);
        }, 2000);

        fetchStats();
      } else {
        toast.error('Upload failed');
        setUploadQueue(prev => prev.map(item => ({
          ...item,
          status: 'failed'
        })));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      setUploadQueue(prev => prev.map(item => ({
        ...item,
        status: 'failed'
      })));
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-5 sm:px-6 lg:px-8">
          <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-300 dark:border-gray-700 px-4 md:px-10 py-3">
              <div className="flex items-center gap-4 text-black dark:text-white">
                <h2 className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                  RecruitFlow Admin
                </h2>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/admin');
                }}
                className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-black text-sm font-bold hover:bg-primary/90"
              >
                Logout
              </button>
            </header>

            <main className="flex flex-col lg:flex-row flex-1 gap-8 p-4 md:p-10">
              {/* Main Content */}
              <div className="flex-1 flex flex-col gap-8">
                <div className="flex flex-wrap justify-between gap-3">
                  <p className="text-black dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                    Upload New CVs
                  </p>
                </div>

                {/* Upload Area */}
                <div
                  className={`flex flex-col items-center gap-6 rounded-lg border-2 border-dashed p-6 py-14 transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <span className="material-symbols-outlined text-black dark:text-white text-5xl">
                    cloud_upload
                  </span>
                  <div className="flex max-w-[480px] flex-col items-center gap-2">
                    <p className="text-black dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] max-w-[480px] text-center">
                      Drag & drop files here
                    </p>
                    <p className="text-black dark:text-white text-sm font-normal leading-normal max-w-[480px] text-center">
                      Supports: PDF, DOCX. Max file size: 5MB.
                    </p>
                  </div>
                  <label className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-black dark:bg-white text-white dark:text-black text-sm font-bold leading-normal tracking-[0.015em]">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Upload Queue */}
                {uploadQueue.length > 0 && (
                  <div className="flex flex-col">
                    <h2 className="text-black dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                      Upload Queue
                    </h2>
                    <div className="flex flex-col gap-2">
                      {uploadQueue.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 bg-white dark:bg-gray-900 px-4 min-h-[72px] py-2 justify-between border border-gray-300 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-black dark:text-white flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0 size-12">
                              <span className="material-symbols-outlined">
                                {item.status === 'completed' ? 'check_circle' : 
                                 item.status === 'failed' ? 'error' : 'description'}
                              </span>
                            </div>
                            <div className="flex flex-col justify-center">
                              <p className="text-black dark:text-white text-base font-medium leading-normal line-clamp-1">
                                {item.file.name}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">
                                {item.status === 'pending' ? 'Pending' :
                                 item.status === 'uploading' ? 'Uploading...' :
                                 item.status === 'completed' ? 'Complete' : 'Failed'}
                              </p>
                            </div>
                          </div>
                          {item.status === 'uploading' && (
                            <div className="shrink-0">
                              <div className="flex items-center gap-3">
                                <div className="w-[88px] overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-600">
                                  <div
                                    className="h-1 rounded-sm bg-black dark:bg-white"
                                    style={{ width: `${item.progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-black dark:text-white text-sm font-medium leading-normal w-6 text-right">
                                  {item.progress}%
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={uploadFiles}
                      disabled={uploadQueue.some(item => item.status === 'uploading')}
                      className="mt-4 flex w-full max-w-[480px] cursor-pointer items-center justify-center rounded-lg h-12 px-4 bg-primary text-black text-base font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Upload All Files
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar Stats */}
              <aside className="w-full lg:w-72 lg:shrink-0 flex flex-col gap-6">
                <h2 className="text-black dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">
                  Quick Stats
                </h2>
                {stats && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg flex flex-col gap-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total CVs in Database</p>
                      <p className="text-3xl font-black text-black dark:text-white">
                        {stats.total_cvs || 0}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg flex flex-col gap-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">CVs Added Today</p>
                      <p className="text-3xl font-black text-black dark:text-white">
                        {stats.cvs_today || 0}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg flex flex-col gap-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Processing Status</p>
                      <p className="text-lg font-bold text-black dark:text-white">
                        {stats.processed_cvs || 0} / {stats.total_cvs || 0}
                      </p>
                    </div>
                  </div>
                )}
                <a
                  href="/admin/cvs"
                  className="w-full mt-4 flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-transparent text-black dark:text-white text-sm font-bold border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  View All CVs
                </a>
              </aside>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}