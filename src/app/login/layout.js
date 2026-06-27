// login/page.js is a Client Component and can't export metadata, so the
// noindex directive lives here. Auth page — kept out of search indexes
// (also blocked in robots.txt). Renders children unchanged; no UI impact.
export const metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }) {
  return children;
}
