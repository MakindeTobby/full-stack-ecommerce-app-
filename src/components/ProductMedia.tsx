"use client"
import React from 'react'

const ProductMedia = ({ productName, medias = [], }: { productName: string; medias?: { id: string; url: string }[]; }) => {

    const [activeThumb, setActiveThumb] = React.useState(0);

    // Thumbnail click handler: update server-rendered main image by id
    function handleThumbClick(idx: number) {
        const m = medias[idx];
        if (!m) return;
        setActiveThumb(idx);

        // mutate the already-rendered main image in DOM (keeps SSR main image)
        try {
            const el = document.getElementById(
                "main-product-image",
            ) as HTMLImageElement | null;
            if (el) {
                el.src = m.url;
                // update alt for accessibility
                el.alt = productName ?? el.alt;
            }
        } catch (e) {
            // fail silently; nothing critical
            console.warn("Failed to update main image element", e);
        }
    }
    return (
        <>
            {medias.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {medias.map((m, idx) => (
                        <button
                            key={m.id ?? `${idx}`}
                            type="button"
                            onClick={() => handleThumbClick(idx)}
                            aria-pressed={activeThumb === idx}
                            className={`overflow-hidden rounded-xl border-2 transition-all ${activeThumb === idx
                                ? "border-violet-500"
                                : "border-transparent hover:border-slate-300"
                                }`}
                        >
                            <img
                                src={m.url}
                                alt={`Thumbnail ${idx + 1}`}
                                className="h-[68px] w-[68px] object-cover sm:h-[72px] sm:w-[72px]"
                            />
                        </button>
                    ))}
                </div>
            )}
        </>
    )
}

export default ProductMedia