import "../styles/globals.css";

import Link from "next/link";

const Navbar = () => {
  return (
    <div className="flex p-4 border-b">
      <Link href="/">
        <div className="font-semibold text-slate-900">mixear</div>
      </Link>
    </div>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <div className="text-center text-gray-500 text-xs p-4 leading-5">
      © {currentYear} Mixear. Made with ❤️ by{" "}
      <Link href="https://github.com/fletcherist" target={"_blank"}>
        @fletcherist
      </Link>{" "}
      for producers and audio engineers
      {" · "}
      <Link href="https://github.com/fletcherist/mixear" target={"_blank"}>
        source code
      </Link>
    </div>
  );
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head />
      <body>
        <div>
          <Navbar />
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
