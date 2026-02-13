export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumerics with dashes
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}
