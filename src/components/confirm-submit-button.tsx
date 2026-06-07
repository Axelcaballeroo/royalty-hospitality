"use client";

export function ConfirmSubmitButton({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className: string;
}) {
  return (
    <button
      className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2`}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
