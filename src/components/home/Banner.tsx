import Image from "next/image";
import { editCardClass, editHClass, editSectionClass } from "@/styles";

const HERO_BANNER_IMG =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80";
const WATCH_IMG =
  "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80";
const APPLIANCE_IMG =
  "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=700&q=80";

export default function Banner() {
  return (
    <section className={editSectionClass} id="editSection">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <a
          href="#"
          className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 p-8 transition hover:shadow-xl"
        >
          <Image
            src={HERO_BANNER_IMG}
            alt="Fashion editorial banner"
            fill
            className="object-cover opacity-50 transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="relative z-10">
            <span className="mb-2 inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-bold text-white">
              New Arrivals
            </span>
            <h3 className="font-display text-2xl font-normal leading-snug text-white">
              Fresh drops
              <br />
              this week
            </h3>
            <p className="mt-2 text-sm text-slate-200">
              Oversized shirts, kaftans, midi gowns
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-white opacity-90 transition group-hover:opacity-100">
              Shop now
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>
          </div>
        </a>

        <div className="flex flex-col gap-4">
          <a href="#" className={editCardClass} id="editWatch">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={WATCH_IMG}
                alt="Wristwatch category"
                fill
                className="object-cover transition duration-300 group-hover:scale-110"
                sizes="80px"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                Wristwatches
              </span>
              <h4 className={editHClass} id="editWatchH">
                Time is luxury
              </h4>
              <p className="mt-1 text-sm text-slate-500">7 premium timepieces</p>
              <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition group-hover:text-violet-700">
                Explore
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          </a>

          <a href="#" className={editCardClass} id="editApp">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
              <Image
                src={APPLIANCE_IMG}
                alt="Appliances category"
                fill
                className="object-cover transition duration-300 group-hover:scale-110"
                sizes="80px"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                Appliances
              </span>
              <h4 className={editHClass} id="editAppH">
                Home essentials
              </h4>
              <p className="mt-1 text-sm text-slate-500">Blenders, coolers, more</p>
              <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-violet-600 transition group-hover:text-violet-700">
                Explore
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
