import { Suspense } from "react";
import { headers } from "next/headers";
import MainPage from "./MainPage";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-sunset flex items-center justify-center shadow-xl animate-gradient ring-1 ring-white/40 dark:ring-white/10">
          <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 2L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex items-center gap-2 text-ink-muted">
          <svg className="animate-spin h-5 w-5 text-gold-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    </div>
  );
}

async function checkIsElectronSSR(): Promise<boolean> {
  try {
    const headersList = await headers();
    const electronHeader = headersList.get('x-electron-app');
    return electronHeader === 'true';
  } catch {
    return false;
  }
}

export default async function Page() {
  // Check if running in Electron during SSR
  const isElectronSSR = await checkIsElectronSSR();

  // For Electron, skip Suspense and render directly
  // This prevents the "Loading..." state during SSR
  if (isElectronSSR) {
    return <MainPage isElectronSSR={true} />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MainPage isElectronSSR={false} />
    </Suspense>
  );
}
