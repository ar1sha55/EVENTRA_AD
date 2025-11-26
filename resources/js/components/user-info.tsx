import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type User } from '@/types';
import { User as UserIcon } from 'lucide-react';

export function UserInfo({
    user,
    showEmail = false,
    showRole = false,
}: {
    user: User;
    showEmail?: boolean;
    showRole?: boolean;
}) {
    const profilePictureSrc = user.profile_picture
        ? `/storage/${user.profile_picture}`
        : user.avatar;

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={profilePictureSrc} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 dark:bg-neutral-700">
                    <UserIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
                {showRole && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.role}
                    </span>
                )}
            </div>
        </>
    );
}
