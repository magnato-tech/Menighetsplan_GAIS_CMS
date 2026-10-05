import React from "react";
import { useStudioAppearance } from "./studioAppearance";

/** Wraps portaled modals so they follow the content theme. */
export const StudioPortal: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => {
  const { contentTheme } = useStudioAppearance();
  return (
    <div data-studio-theme={contentTheme} className={className}>
      {children}
    </div>
  );
};
