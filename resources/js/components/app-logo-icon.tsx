import { SVGAttributes } from 'react';
import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        
        <img src="/images/volunteer-utm-logo.png" alt="Logo" {...props} />
    );
} 