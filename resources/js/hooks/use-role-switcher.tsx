import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';

type RoleView = 'member' | 'manager' | 'admin';

interface RoleSwitcherState {
    selectedView: RoleView;
    actualRole: string;
    updateView: (view: RoleView) => void;
    canUseRoleSwitcher: boolean;
}

export function useRoleSwitcher(): RoleSwitcherState {
    const { auth } = usePage().props;
    const actualRole = auth?.user?.role || 'user';
    const canUseRoleSwitcher = actualRole === 'admin';

    // Initialize from localStorage or default to actual role
    const getInitialView = (): RoleView => {
        if (!canUseRoleSwitcher) return 'member';

        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('viewAs_role');
            if (stored && ['member', 'manager', 'admin'].includes(stored)) {
                return stored as RoleView;
            }
        }
        return actualRole as RoleView;
    };

    const [selectedView, setSelectedView] = useState<RoleView>(getInitialView);

    const updateView = (view: RoleView) => {
        if (!canUseRoleSwitcher) return;

        setSelectedView(view);

        // Persist to localStorage
        localStorage.setItem('viewAs_role', view);

        // Persist to cookie for SSR
        document.cookie = `viewAs_role=${view};path=/;max-age=31536000;SameSite=Lax`;
    };

    // Initialize on mount
    useEffect(() => {
        if (canUseRoleSwitcher) {
            const stored = localStorage.getItem('viewAs_role');
            if (stored && ['member', 'manager', 'admin'].includes(stored)) {
                setSelectedView(stored as RoleView);
            }
        }
    }, [canUseRoleSwitcher]);

    return {
        selectedView,
        actualRole,
        updateView,
        canUseRoleSwitcher,
    };
}
