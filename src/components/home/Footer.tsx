export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="mb-4 flex flex-col leading-none">
              <span className="font-display text-xl text-white">Queen Beulah</span>
              <span className="text-[9px] font-bold uppercase tracking-[.22em] text-violet-400">
                Collections
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              Fashion, sneakers, bags, and lifestyle - curated and delivered
              across Nigeria.
            </p>
            <div className="mt-4 flex gap-2">
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400 transition hover:border-violet-500 hover:text-violet-400"
              >
                ig
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400 transition hover:border-violet-500 hover:text-violet-400"
              >
                tw
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#25D366]/40 text-[10px] text-[#25D366] transition hover:bg-[#25D366]/10"
              >
                wa
              </a>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">
              Shop
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="transition hover:text-white">
                  All Products
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Sneakers
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Bags & Purses
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Fashion
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Flash Sales
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">
              Help
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="transition hover:text-white">
                  Track Order
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Returns Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white">
              Company
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#" className="transition hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs">
            © 2025 Queen Beulah Collections. All rights reserved.
          </p>
          <p className="text-xs">Made in Nigeria</p>
        </div>
      </div>
    </footer>
  );
}
