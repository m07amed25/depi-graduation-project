"use client";

import {
  CursorProvider,
  Cursor,
} from "@/components/animate-ui/components/animate/cursor";

export function GlobalCursorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CursorProvider global={true}>
      <Cursor />
      {children}
    </CursorProvider>
  );
}
