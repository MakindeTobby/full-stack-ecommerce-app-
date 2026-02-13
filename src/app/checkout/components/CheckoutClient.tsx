"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type CreateOrderInput,
  createOrderSchema,
} from "@/lib/validation/checkout";

type CartItem = {
  id: string;
  product_id: string;
  variant_id: string | null;
  name_snapshot?: string | null;
  sku?: string | null;
  quantity: number;
  unit_price: string;
  thumbnail?: string | null;
};

export default function CheckoutClient({
  initialCart,
  initialAddresses,
  userId,
}: {
  initialCart: any;
  initialAddresses: any[];
  userId: string;
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses ?? []);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses?.[0]?.id ?? null,
  );
  const [addingAddress, setAddingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "paystack">("cod");
  const [loading, setLoading] = useState(false);
  const cart = initialCart;

  async function addAddress() {
    if (
      !addrForm.full_name ||
      !addrForm.street ||
      !addrForm.city ||
      !addrForm.country
    ) {
      toast.error("Please fill in required address fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(addrForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to save address");
      const newAddr = json.address;
      setAddresses((s) => [newAddr, ...s]);
      setSelectedAddressId(String(newAddr.id));
      setAddingAddress(false);
      toast.success("Address saved");
    } catch (e: any) {
      console.error("addAddress error", e);
      toast.error(e.message ?? "Failed to add address");
    } finally {
      setLoading(false);
    }
  }

  async function placeOrder() {
    if (!cart || cart.itemCount === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!userId) {
      toast.error("You must be signed in to place an order");
      return;
    }
    if (!selectedAddressId) {
      toast.error("Please select a shipping address");
      return;
    }

    const payload: CreateOrderInput = {
      cartId: String(cart.id),
      userId,
      addressId: selectedAddressId,
      couponCode: null,
      currency: "NGN",
    };

    try {
      createOrderSchema.parse(payload);
    } catch (err: any) {
      toast.error("Checkout validation failed");
      console.error(err);
      return;
    }

    setLoading(true);
    toast.loading("Placing order...", { id: "placing" });
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Order failed", { id: "placing" });
        setLoading(false);
        return;
      }

      const orderId = json.orderId ?? json.order?.id ?? null;
      if (!orderId) {
        toast.success("Order placed", { id: "placing" });
        mutate("/api/cart");
        router.push("/orders");
        return;
      }

      if (paymentMethod === "paystack") {
        toast.loading("Redirecting to Paystack...", { id: "placing" });
        const payRes = await fetch("/api/payments/paystack/initialize", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const payJson = await payRes.json().catch(() => null);
        if (!payRes.ok) {
          throw new Error(payJson?.error ?? "Failed to initialize Paystack");
        }

        const authorizationUrl = payJson?.authorizationUrl as
          | string
          | undefined;
        if (!authorizationUrl) {
          throw new Error("Missing Paystack authorization URL");
        }

        mutate("/api/cart");
        window.location.assign(authorizationUrl);
        return;
      }

      toast.success("Order placed", { id: "placing" });
      mutate("/api/cart");
      router.push(`/order/${orderId}`);
    } catch (err: any) {
      console.error("placeOrder error", err);
      toast.error(err?.message ?? "Order failed", { id: "placing" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-medium">Shipping address</h2>

        {addresses.length === 0 && !addingAddress && (
          <div className="mb-3 text-sm text-gray-500">
            No saved addresses. Add one now.
          </div>
        )}

        <div className="space-y-2">
          {addresses.map((a) => (
            <label
              key={a.id}
              className={`block cursor-pointer rounded border p-3 ${
                selectedAddressId === String(a.id)
                  ? "border-indigo-200 bg-indigo-50"
                  : ""
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === String(a.id)}
                onChange={() => setSelectedAddressId(String(a.id))}
                className="mr-2"
              />
              <span className="block font-medium">
                {a.label} - {a.full_name}
              </span>
              <span className="block text-sm text-gray-600">
                {a.street} | {a.city} | {a.country}
              </span>
              <div className="mt-1 text-xs text-gray-500">Phone: {a.phone}</div>
            </label>
          ))}
        </div>

        {addingAddress ? (
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Full name"
              value={addrForm.full_name}
              onChange={(e) =>
                setAddrForm({ ...addrForm, full_name: e.target.value })
              }
            />
            <Input
              placeholder="Phone"
              value={addrForm.phone}
              onChange={(e) =>
                setAddrForm({ ...addrForm, phone: e.target.value })
              }
            />
            <Input
              placeholder="Street"
              value={addrForm.street}
              onChange={(e) =>
                setAddrForm({ ...addrForm, street: e.target.value })
              }
            />
            <div className="flex gap-2">
              <Input
                placeholder="City"
                value={addrForm.city}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, city: e.target.value })
                }
                className="flex-1"
              />
              <Input
                placeholder="Country"
                value={addrForm.country}
                onChange={(e) =>
                  setAddrForm({ ...addrForm, country: e.target.value })
                }
                className="w-36"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={addAddress}
                variant="primary"
                disabled={loading}
              >
                Save address
              </Button>
              <Button
                type="button"
                onClick={() => setAddingAddress(false)}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <Button
              type="button"
              onClick={() => setAddingAddress(true)}
              variant="secondary"
            >
              + Add address
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Payment method</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
            />
            <div>
              <div className="font-medium">Cash on Delivery</div>
              <div className="text-sm text-gray-500">
                Pay when the order is delivered
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="payment"
              checked={paymentMethod === "paystack"}
              onChange={() => setPaymentMethod("paystack")}
            />
            <div>
              <div className="font-medium">Pay with card (Paystack)</div>
              <div className="text-sm text-gray-500">
                Secure online payment (card / bank / transfer)
              </div>
            </div>
          </label>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Items</h2>
        <div className="space-y-3">
          {cart.items.map((it: CartItem) => (
            <div key={it.id} className="flex items-center gap-4 border-b pb-3">
              <div className="h-16 w-16 overflow-hidden rounded bg-gray-100">
                {it.thumbnail ? (
                  <img
                    src={it.thumbnail}
                    alt={it.name_snapshot || it.sku || "Product image"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{it.name_snapshot ?? it.sku}</div>
                <div className="text-sm text-gray-600">Qty: {it.quantity}</div>
              </div>
              <div className="text-right font-semibold">
                ${(Number(it.unit_price) * it.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            onClick={() => {
              window.location.href = "/cart";
            }}
            variant="secondary"
          >
            Edit cart
          </Button>

          <div className="text-right">
            <div className="text-sm">Items: {cart.itemCount}</div>
            <div className="text-xl font-semibold">Total: ${cart.subTotal}</div>
            <div className="mt-2">
              <Button onClick={placeOrder} disabled={loading} variant="primary">
                {loading
                  ? "Placing order..."
                  : paymentMethod === "cod"
                    ? "Place order (COD)"
                    : "Pay with card"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
