import Root from "@/components/Root";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("en");
export default function Layout({ children }: { children: React.ReactNode }) { return <Root lang="en">{children}</Root>; }
