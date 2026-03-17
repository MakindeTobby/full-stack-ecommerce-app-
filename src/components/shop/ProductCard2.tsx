"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Heart, PlusIcon, ShoppingCart } from "lucide-react";
// import { Button } from "../ui/button";
import toast from "react-hot-toast";
import FlashCountdown from "../FlashCountdown";
import { classNames, fmtNGN } from "@/helpers";

type ProductCardProps = {
    id: string;
    slug: string;
    name: string;
    categoryName?: string | null;
    imageUrl?: string | null;
    price: number;
    compareAtPrice?: number | null;
    flashEndsAt?: string | null;
    isFlash?: boolean;
    className?: string;
};
const FALLBACK_IMG =
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80";

function deriveMeta(seedText: string) {
    const seed = [...seedText].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const rating = (4.2 + (seed % 8) * 0.1).toFixed(1);
    const reviews = 40 + ((seed * 13) % 460);
    const sold = 120 + ((seed * 17) % 900);
    return { rating, reviews, sold };
}
const ProductCard2 = ({ name, id, price, slug, categoryName, compareAtPrice, flashEndsAt, imageUrl, isFlash }: ProductCardProps) => {
    const nairaPrice = (price: number) => `₦${price.toLocaleString()}`;
    const meta = deriveMeta(id + slug);
    const hasDiscount =
        typeof compareAtPrice === "number" && compareAtPrice > Number(price);
    const showFlash = Boolean(isFlash);

    //   const { addItem } = useCartStore();
    //   const discountedPrice =
    //     data.discount.percentage > 0
    //       ? Math.round(data.price - (data.price * data.discount.percentage) / 100)
    //       : data.discount.amount > 0
    //       ? data.price - data.discount.amount
    //       : data.price;

    //   const handleAddToCart = () => {
    //     addItem({
    //       id: data.id,
    //       name: data.title,
    //       price: data.price,
    //       image: data.srcUrl,
    //       category: data.title,
    //     });
    //     toast.success(`${data.title} added to cart!`);
    //   };

    //   const { toggleWishlist, isInWishlist } = useWishlistStore();

    //   const inWishlist = isInWishlist(data.id);

    //   const handleWishlist = (e: React.MouseEvent) => {
    //     e.preventDefault(); // prevent navigation if inside a Link
    //     toggleWishlist({
    //       id: data.id,
    //       name: data.title,
    //       price: data.price,
    //       originalPrice: data.price,
    //       image: data.srcUrl,
    //       category: data.title,
    //     });
    //     toast.success(
    //       isInWishlist(data.id)
    //         ? `${data.title} removed from wishlist`
    //         : `${data.title} added to wishlist`
    //     );
    //     toast.success(
    //       inWishlist
    //         ? `${data.title} removed from wishlist`
    //         : `${data.title} added to wishlist`
    //     );
    //   };

    return (
        <div
            // href={`/shop/product/${data.id}/${data.title.split(" ").join("-")}`}
            className="flex flex-col items-start aspect-auto"
        >
            <div className="bg-[#F0EEED] relative rounded-[13px]  w-full  aspect-square mb-2.5  overflow-hidden">
                <Image
                    src={imageUrl || ""}
                    width={295}
                    height={298}
                    className="rounded-md w-full h-full object-cover hover:scale-105 transition-transform duration-500 ease-in-out"
                    alt={name}
                    priority
                />
                <>
                    <div className="absolute left-3 top-3 z-10 flex gap-1.5">
                        {showFlash ? (
                            <span className="rounded-full bg-red-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                                Flash
                            </span>
                        ) : null}
                        {!showFlash && hasDiscount ? (
                            <span className="rounded-full bg-violet-600 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                                Sale
                            </span>
                        ) : null}
                    </div>

                    <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-700 shadow-sm">
                        Top rated
                    </div>

                </>

                {/* <Button
          size="icon"
          value="ghost"
          onClick={handleWishlist}
          className="absolute !p-0 !shadow-none top-2 right-2 z-10  rounded-full bg-white/40 hover:bg-white  backdrop-blur-md"
        >
          <Heart
            size={22}
            className={`h-5 w-5 transition-colors ${
              inWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }`}
          />
        </Button> */}
                {/* <Button
          size="icon"
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 z-10  rounded-full bg-brand hover:bg-brand/80  backdrop-blur-md  shadow-xl"
        >
          <ShoppingCart size={22} className=" text-white" />
        </Button> */}
            </div>
            <Link
                href={`/products/${slug}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {categoryName ?? "Collection"}
                </p>
                <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-slate-900">
                    {name}
                </h3>
                {/* <div className="flex items-end mb-1 ">
          <Rating
            initialValue={data.rating}
            allowFraction
            SVGclassName="inline-block"
            emptyClassName="fill-gray-50"
            size={18}
            readonly
          />
          <span className="text-xs  ml-2 text-muted-foreground">
            {data.rating.toFixed(1)}
            <span className="opacity-60">/5</span>
          </span>
        </div> */}
                <div className="flex items-center flex-wrap gap-2">
                    {/* <span className="font-bold text-lg  text-brand">
                        {nairaPrice(price)}
                    </span> */}
                    {/* {(data.discount.percentage > 0 || data.discount.amount > 0) && (
            <>
              <span className="font-semibold line-through text-gray-400 text-sm ">
                {nairaPrice(data.price)}
              </span>
              <span className="text-[10px]  py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333] font-medium">
                {data.discount.percentage > 0
                  ? `-${data.discount.percentage}%`
                  : `-${nairaPrice(data.discount.amount)}`}
              </span>
            </>
          )} */}
                    <div className=" flex items-end gap-2">
                        <p className={classNames("text-lg font-bold", showFlash ? "text-red-600" : "text-slate-900")}>
                            {fmtNGN(Number(price))}
                        </p>
                        {hasDiscount ? (
                            <p className="text-xs text-slate-400 line-through">
                                {fmtNGN(Number(compareAtPrice))}
                            </p>
                        ) : null}
                    </div>

                    {flashEndsAt ? (
                        <div className="mt-2">
                            <FlashCountdown endsAt={flashEndsAt} />
                        </div>
                    ) : null}


                </div>
            </Link>
        </div>
    );
};

export default ProductCard2;
