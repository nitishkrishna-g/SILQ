'use client';

import { useTaskStore } from '@/store/taskStore';
import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useTaskStore((s) => s.theme);

    useEffect(() => {
        if (theme === 'light') {
            document.documentElement.classList.add('light-mode');
        } else {
            document.documentElement.classList.remove('light-mode');
        }
    }, [theme]);

    return <>{children}</>;
}
