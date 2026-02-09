import { PropsWithChildren } from "react";

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <div className="px-4 md:px-8 h-full flex flex-col items-center gap-6">
      {children}
    </div>
  );
}
