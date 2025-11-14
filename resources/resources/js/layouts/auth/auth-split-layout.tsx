import AppLogoIcon from '@/components/app-logo-icon';
import image1 from '../../../images/image1.jpg';
import clublogo from '../../../images/clublogo.jpg';
import { home } from '@/routes';

import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {


    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted px-10 pt-6 pb-10 text-white lg:flex dark:border-r">
                <div
                    className="absolute inset-0" 
                    style={{
                        // 🌟 CORRECTED LINE: Use the imported JS variable directly 🌟
                        backgroundImage: `url(${image1})`, // Use the imported variable
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                <Link
                    href={home()}
                    className="relative z-20 flex items-center justify-center gap-4 text-2xl font-medium"
                >
                    <img src={clublogo} alt="UTM Volunteer Club" className="size-24 rounded-full" />
                    UTM Volunteer Club
                </Link>

                <div className="absolute bottom-10 left-10 z-20">
                    <blockquote className="max-w-md space-y-2">
                        <p className="text-xl italic">
                            &ldquo;Your small contribution can make a big difference.&rdquo;
                        </p>
                    </blockquote>
                    <div className="mt-4 text-sm">Powered by Eventra</div>
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <img src={clublogo} alt="UTM Volunteer Club" className="h-20 w-20 rounded-full" />
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
