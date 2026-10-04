import React from "react";
import { Link } from "react-router-dom";
import { useCmsLinkResolver } from "../../hooks/useCmsLink";

interface CmsResolvedLinkProps {
  raw?: string;
  fallback?: string;
  className?: string;
  children: React.ReactNode;
}

export const CmsResolvedLink: React.FC<CmsResolvedLinkProps> = ({
  raw,
  fallback,
  className,
  children,
}) => {
  const { resolve } = useCmsLinkResolver();
  const href = resolve(raw, fallback);
  if (!href) return null;

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
};
