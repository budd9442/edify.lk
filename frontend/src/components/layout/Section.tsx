import React from 'react';
import { motion } from 'framer-motion';
import Container from './Container';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: 'transparent' | 'dark' | 'darker' | 'gradient';
  animate?: boolean;
  id?: string;
}

const Section: React.FC<SectionProps> = ({
  children,
  className = '',
  containerSize = 'xl',
  padding = 'lg',
  background = 'transparent',
  animate = false,
  id
}) => {
  const paddingClasses = {
    none: '',
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
    xl: 'py-24'
  };

  const backgroundClasses = {
    transparent: '',
    dark: 'bg-dark-900',
    darker: 'bg-dark-950',
    gradient: 'bg-gradient-to-b from-dark-950 to-dark-900'
  };

  const baseClasses = `${paddingClasses[padding]} ${backgroundClasses[background]} ${className}`;

  const SectionComponent = animate ? motion.section : 'section';
  const motionProps = animate ? {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
    transition: { duration: 0.8, ease: 'easeOut' }
  } : {};

  return (
    <SectionComponent id={id} className={baseClasses} {...motionProps}>
      <Container size={containerSize}>
        {children}
      </Container>
    </SectionComponent>
  );
};

export default Section;