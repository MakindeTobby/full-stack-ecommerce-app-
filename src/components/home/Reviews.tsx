"use client"
import { ratingNumClass, reviewBodyClass, reviewCardClass, reviewCountClass, reviewSectionClass, reviewTitleClass } from '@/styles'
import React, { useMemo } from 'react'

const Reviews = () => {
    const REVIEWS = useMemo(
        () => [
            { init: "A", color: "bg-violet-100 text-violet-700", name: "Adaeze O.", city: "Lagos", r: 5, body: "Got my bag in 2 days, packaged perfectly. Exactly what I ordered and the quality is top notch!" },
            { init: "K", color: "bg-green-100 text-green-700", name: "Kunle B.", city: "Abuja", r: 5, body: "The sneakers are 100% authentic. I was skeptical but Queen Beulah proved me wrong. Fast delivery!" },
            { init: "F", color: "bg-amber-100 text-amber-700", name: "Fatima M.", city: "Kano", r: 4, body: "The flash sale prices are insane! Got a ₦38k bag for ₦28k. WhatsApp support is super responsive." },
            { init: "C", color: "bg-pink-100 text-pink-700", name: "Chisom E.", city: "Port Harcourt", r: 5, body: "Ordered the leather backpack as a gift. Quality and stitching is premium. Highly recommended!" },
            { init: "N", color: "bg-teal-100 text-teal-700", name: "Ngozi A.", city: "Enugu", r: 5, body: "As a repeat customer, every purchase has been perfect. The midi gown fits beautifully." },
        ],
        []
    );
    return (
        <section className={reviewSectionClass} id="reviewSection">
            <div className="mb-8 flex items-end justify-between ">
                <div>
                    <div className="sec-label mb-2">Social Proof</div>
                    <h2 className={reviewTitleClass} id="reviewTitle">
                        What customers say
                    </h2>
                </div>

                <div className="hidden flex-col items-end sm:flex">
                    <div className="flex items-baseline gap-2">
                        <span className={ratingNumClass} id="ratingNum">
                            4.8
                        </span>
                        <span className="text-sm text-slate-500">/ 5</span>
                    </div>
                    <div className="flex text-amber-400 text-sm">★★★★★</div>
                    <p className={reviewCountClass} id="reviewCount">
                        Based on 2,300+ reviews
                    </p>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scroll pb-2 " id="reviewList">
                {REVIEWS.map((r, idx) => (
                    <div key={idx} className={reviewCardClass}>
                        <div className="flex text-amber-400 text-sm">
                            {"★".repeat(r.r)}
                            {"☆".repeat(5 - r.r)}
                        </div>
                        <p className={reviewBodyClass}>&quot;{r.body}&quot;</p>
                        <div className="mt-4 flex items-center gap-2.5">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${r.color} text-sm font-bold`}>{r.init}</div>
                            <div>
                                <p className="text-xs font-semibold text-slate-800">{r.name}</p>
                                <p className="text-[10px] text-slate-400">
                                    {r.city} · Verified buyer
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Reviews