// Turns a display name into the part of the URL after the slash.
// "Isabel González Lopez"     -> "isabel-gonzalez-lopez"
// "Thanh Tuyen (Zoe) Nguyen"  -> "thanh-tuyen-zoe-nguyen"
export function slugify(name: string): string {
  return name
    .normalize("NFD") // split "á" into "a" + an accent mark
    .replace(/[̀-ͯ]/g, "") // drop the accent marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // anything that is not a letter or digit becomes "-"
    .replace(/^-+|-+$/g, ""); // no "-" at the start or end
}
