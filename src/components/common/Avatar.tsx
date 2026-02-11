import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
    src?: string | null;
    alt: string;
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, className = '' }) => {
    const [error, setError] = useState(false);

    // Filter out the hardcoded default if it somehow creeps in from other places
    const validSrc = src && src !== '/logo.png' ? src : null;

    if (!validSrc || error) {
        return (
            <div
                className={`bg-dark-800 flex items-center justify-center rounded-full text-gray-400 ${className}`}
                role="img"
                aria-label={alt}
            >
                <User className="w-[60%] h-[60%]" />
            </div>
        );
    }

    return (
        <img
            src={validSrc}
            alt={alt}
            className={`object-cover rounded-full ${className}`}
            onError={() => setError(true)}
        />
    );
};

export default Avatar;
