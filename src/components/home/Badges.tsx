import Image from "next/image";
import { trustCardClass, trustHClass, trustSectionClass, trustTitleClass } from "@/styles";

const BADGE_ITEMS = [
  {
    n: 1,
    title: "100% Authentic",
    body: "Every product verified before it reaches you. No fakes, ever.",
    bg: "bg-violet-50",
    image:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=300&q=80",
  },
  {
    n: 2,
    title: "Free Delivery",
    body: "Orders above N15,000 ship free anywhere in Nigeria.",
    bg: "bg-green-50",
    image:
      "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=300&q=80",
  },
  {
    n: 3,
    title: "7-Day Returns",
    body: "Not happy? Return within 7 days, no questions asked.",
    bg: "bg-amber-50",
    image:
      "https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=300&q=80",
  },
  {
    n: 4,
    title: "WhatsApp Support",
    body: "Real humans, fast replies. We are always here for you.",
    bg: "bg-blue-50",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=300&q=80",
  },
];

export default function Badges() {
  return (
    <section className={trustSectionClass} id="trustSection">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center">
          <div className="sec-label mb-2 justify-center">Why Queen Beulah</div>
          <h2 className={trustTitleClass} id="trustTitle">
            Built on trust
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BADGE_ITEMS.map((t) => (
            <div key={t.n} className={trustCardClass} id={`trust${t.n}`}>
              <div
                className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ${t.bg}`}
              >
                <Image
                  src={t.image}
                  alt={t.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <p className={trustHClass} id={`t${t.n}`}>
                  {t.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {t.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
