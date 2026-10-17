import type {ReactNode} from 'react';

export const sectionId = (title: string) =>
  `section-${title.replaceAll(' ', '-').toLowerCase()}`;

export function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const id = sectionId(title);
  return (
    <section
      id={id}
      className="catalog-section"
      data-catalog-section={title}
      aria-labelledby={`${id}-title`}
    >
      <div className="catalog-section-title">
        <span className="rc-eyebrow">{eyebrow}</span>
        <h2 id={`${id}-title`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function PanelTitle({title, meta}: {title: string; meta?: string}) {
  return (
    <div className="catalog-panel-title">
      <strong>{title}</strong>
      {meta && <span>{meta}</span>}
    </div>
  );
}
