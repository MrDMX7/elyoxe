import Root from "@/components/Root";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("ar");
export default function Layout({ children }: { children: React.ReactNode }) { return <Root lang="ar">{children}</Root>; }
