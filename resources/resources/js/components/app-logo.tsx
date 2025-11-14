import AppLogoIcon from './app-logo-icon';
import clublogo from '../../images/clublogo.jpg';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <img
                    src={clublogo}
                    alt="UTM Volunteer Club"
                    className="h-full w-full rounded-full object-cover"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    Eventra
                </span>
            </div>
        </>
    );
}
