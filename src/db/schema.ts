// Backward-compatible barrel.
// Keep importing from "@/db/schema" across the app while
// schema definitions are organized by domain in "./schema/*".
export * from "./schema/index";
