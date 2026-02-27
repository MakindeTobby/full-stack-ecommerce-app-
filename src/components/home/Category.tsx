import { catSectionClass, catTitleClass } from '@/styles'
import { LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const Category = (
    { categories }: {
        categories: {
            id: string;
            name: string;
            slug: string;
            product_count: number;
        }[]
    }
) => {
    return (
        <section className={catSectionClass} id="catSection">
            <div className="mb-8 flex items-end justify-between ">
                <div>
                    <div className="sec-label mb-2">Browse by Category</div>
                    <h2 className={catTitleClass} id="catTitle">
                        Shop your style
                    </h2>
                </div>
                <Link href="#" className=" items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 transition sm:flex">
                    View all{" "}
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 ">

                {categories.slice(0, 6).map((c) => (

                    <Link
                        key={c.id}
                        href={`/products?${new URLSearchParams({
                            category: c.slug,
                        }).toString()}`}
                        id={`c-${c.id}`}
                        className={`cat-card group flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition border-slate-200 bg-white hover:border-violet-300 hover:shadow-md`}
                    >
                        {/* <div className={`flex h-14 w-14 items-center justify-center rounded-2xl  text-3xl transition group-hover:scale-110`}>
                            <LayoutGrid />
                        </div> */}
                        <div>
                            <p id={`cl-${c.id}`} className={`text-sm font-semibold text-slate-800`}>
                                {c.name}
                            </p>
                            <p className="text-xs text-slate-400">{Number(c.product_count ?? 0)} items</p>
                        </div>
                    </Link>

                ))}
            </div>
        </section>

    )
}

export default Category