import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
export function Button({children,className='',...props}:PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button className={`rounded-xl bg-[var(--onblank-blue)] px-4 py-2.5 font-semibold text-white ${className}`} {...props}>{children}</button>;
}
