import { Check, User, Briefcase, Shield } from 'lucide-react';
import {
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRoleSwitcher } from '@/hooks/use-role-switcher';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

type RoleView = 'member' | 'manager' | 'admin';

interface RoleOption {
    value: RoleView;
    label: string;
    icon: any;
    description: string;
}

const roleOptions: RoleOption[] = [
    {
        value: 'member',
        label: 'Member View',
        icon: User,
        description: 'View as regular member',
    },
    {
        value: 'manager',
        label: 'Manager View',
        icon: Briefcase,
        description: 'View as event manager',
    },
    {
        value: 'admin',
        label: 'Admin View',
        icon: Shield,
        description: 'Full system access',
    },
];

export function RoleSwitcher() {
    const { selectedView, updateView, canUseRoleSwitcher } = useRoleSwitcher();

    if (!canUseRoleSwitcher) return null;

    const handleViewChange = (view: RoleView) => {
        const option = roleOptions.find(opt => opt.value === view);

        updateView(view);

        // Show toast notification
        toast.success(`Switched to ${option?.label}`, {
            description: option?.description,
            duration: 3000,
        });

        // Force fresh navigation to remount layout components
        router.visit(window.location.href, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    return (
        <>
            <DropdownMenuLabel>Switch View As</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedView === option.value;

                return (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleViewChange(option.value)}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 mr-2" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{option.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {option.description}
                                    </span>
                                </div>
                            </div>
                            {isSelected && <Check className="h-4 w-4 ml-2" />}
                        </div>
                    </DropdownMenuItem>
                );
            })}
            <DropdownMenuSeparator />
        </>
    );
}
