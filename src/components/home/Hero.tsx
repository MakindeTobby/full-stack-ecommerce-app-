import Image from "next/image";
import Link from "next/link";
import {
  floatCardClass,
  heroCardClass,
  heroSectionClass,
  heroStripClass,
  heroSubClass,
  heroTitleClass,
  statDivClass,
  statLblClass,
  statNumClass,
  stripPriceClass,
} from "@/styles";

const HERO_IMG =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80";
const FLOAT_RIGHT_IMG =
  "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=600&q=80";
const FLOAT_LEFT_IMG =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

export default function Hero() {
  return (
    <section className={heroSectionClass} id="heroSection">
      <div className="grid min-h-[80vh] grid-cols-1 gap-8 py-12 md:grid-cols-2 md:items-center md:py-0">
        <div className="order-2 flex flex-col justify-center py-8 md:order-1">
          <div className="sec-label mb-5 fade-up">New Season - 2025</div>
          <h1 className={heroTitleClass} id="heroTitle">
            Dress the life
            <br />
            <em style={{ fontStyle: "italic" }}>you deserve</em>
          </h1>
          <p className={heroSubClass} id="heroSub">
            Curated fashion, sneakers, bags, watches and lifestyle essentials -
            delivered to your door across Nigeria.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 fade-up d3">
            <Link
              href="/products"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md active:scale-[0.98]"
            >
              Shop the Collection
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <a
              href="#"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
              id="newArrivalsBtn"
            >
              New Arrivals
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6 fade-up d4">
            <div className="flex flex-col">
              <span className={statNumClass} id="stat1">
                4,800+
              </span>
              <span className={statLblClass} id="statLbl1">
                Happy customers
              </span>
            </div>
            <div className={statDivClass} id="div1" />
            <div className="flex flex-col">
              <span className={statNumClass} id="stat2">
                100%
              </span>
              <span className={statLblClass} id="statLbl2">
                Authentic products
              </span>
            </div>
            <div className={statDivClass} id="div2" />
            <div className="flex flex-col">
              <span className={statNumClass} id="stat3">
                36
              </span>
              <span className={statLblClass} id="statLbl3">
                States covered
              </span>
            </div>
          </div>
        </div>

        <div className="order-1 flex items-center justify-center pb-4 pt-8 md:order-2 md:py-12">
          <div className="float-a relative mx-auto w-full max-w-sm">
            <div className={heroCardClass} id="heroCard">
              <div className="absolute left-4 top-4 z-10">
                <span className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                  Flash Sale - 26% off
                </span>
              </div>

              <div className="absolute right-4 top-4 z-10">
                <button
                  id="heroWishBtn"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-sm transition hover:scale-110 hover:text-red-500"
                  aria-label="Wishlist"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                </button>
              </div>

              <div className="relative h-full w-full overflow-hidden rounded-2xl">
                <Image
                  src={HERO_IMG}
                  alt="Featured handbag and fashion accessories"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 420px"
                />
              </div>

              <div className={heroStripClass} id="heroStrip">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Quilted Chain Bag
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className={stripPriceClass} id="stripPrice">
                        N28,000
                      </span>
                      <span className="text-xs font-medium text-slate-400 line-through">
                        N38,000
                      </span>
                    </div>
                  </div>

                  <button
                    id="heroCartBtn"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
                    aria-label="Add to cart"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="float-b absolute -right-10 top-14 hidden md:block">
              <div className={floatCardClass} id="floatR">
                <div className="relative mb-1.5 h-14 overflow-hidden rounded-xl bg-slate-50">
                  <Image
                    src={FLOAT_RIGHT_IMG}
                    alt="Sneaker highlight"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <p className="truncate text-[10px] font-semibold text-slate-700">
                  Air Force 1
                </p>
                <p className="text-[10px] font-bold text-violet-600">N45,000</p>
              </div>
            </div>

            <div className="float-c absolute -left-10 bottom-32 hidden md:block">
              <div className={floatCardClass} id="floatL">
                <div className="relative mb-1.5 h-14 overflow-hidden rounded-xl bg-slate-50">
                  <Image
                    src={FLOAT_LEFT_IMG}
                    alt="Watch highlight"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <p className="truncate text-[10px] font-semibold text-slate-700">
                  Geneva Watch
                </p>
                <p className="text-[10px] font-bold text-violet-600">N18,000</p>
              </div>
            </div>

            <div className="absolute -top-5 left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-sm md:flex">
              <span className="pulse-dot h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[11px] font-semibold text-amber-700">
                12 people viewing now
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
