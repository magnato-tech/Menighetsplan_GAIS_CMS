import React from "react";
import { ModulePresentationConfig } from "../../utils/modulePresentation";

interface PresentationSectionProps {
  config: ModulePresentationConfig;
  className: string;
  children: React.ReactNode;
}

/** Optional background image or color for CMS module sections. */
export const PresentationSection: React.FC<PresentationSectionProps> = ({
  config,
  className,
  children,
}) => {
  const image = config.backgroundImage?.trim();
  const color = config.backgroundColor?.trim();

  if (!image && !color) {
    return <section className={className}>{children}</section>;
  }

  return (
    <section className={`${className} relative overflow-hidden`}>
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden />
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: color ? `${color}cc` : "rgba(28, 25, 23, 0.72)",
            }}
          />
        </>
      )}
      {!image && color && (
        <div className="absolute inset-0" style={{ backgroundColor: color }} aria-hidden />
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
};
