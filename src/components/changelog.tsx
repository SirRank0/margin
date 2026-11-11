import { changelog } from "@/data/changelog";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return dateFormat.format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function ChangelogSection() {
  return (
    <section className="max-w-2xl">
      <h1 className="font-display text-4xl text-fg sm:text-5xl">What's new</h1>
      <p className="mt-2 text-pretty text-muted">
        Changes to the numbers and tools on this site, newest first.
      </p>
      <ol className="mt-8 grid gap-4">
        {changelog.map((entry, index) => (
          <li
            key={`${entry.date}-${index}`}
            className="rounded-card border border-line bg-surface p-4 sm:p-5"
          >
            <time className="text-sm text-muted" dateTime={entry.date}>
              {formatDate(entry.date)}
            </time>
            <p className="mt-2 text-pretty text-fg">{entry.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
