"use client";

import { useEffect } from 'react';
import { db, enableNetwork, disableNetwork } from '@/app/lib/supabaseDb';
import { LiffProvider } from '@/context/LiffProvider';
import { ToastProvider } from '@/app/components/Toast';
import { ProfileProvider } from '@/context/ProfileProvider';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {

    useEffect(() => {
        const handleVisibilityChange = async () => {
            try {
                if (document.hidden) {
                    await disableNetwork(db);
                } else {
                    await enableNetwork(db);
                }
            } catch (err) {
                console.error("Error toggling network:", err);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return (
        <ToastProvider>
            <LiffProvider>
                <ProfileProvider>
                    <div
                        className="min-h-screen relative"
                        style={{ background: 'linear-gradient(to bottom, #F0FDFA 0%, #F8FAFC 35%, #FFFFFF 100%)' }}
                    >
                        <main className='w-full max-w-md mx-auto min-h-screen relative z-10'>
                            {children}
                        </main>
                    </div>
                </ProfileProvider>
            </LiffProvider>
        </ToastProvider>
    );
}
