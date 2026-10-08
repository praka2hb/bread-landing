import type { Metadata } from "next";
import Link from "next/link";
import { sandwichWebStyles as styles } from "@/app/components/sandwich-web";
import {
  Avatar,
  PageHead,
  ReadOnlyNote,
  marketAppStyles as appStyles,
} from "@/app/components/market-app";
import {
  DIRECTORY_PAGE_SIZE,
  getUserDirectory,
  type DirectoryUser,
} from "@/lib/users";

export const metadata: Metadata = {
  title: "People — Bread",
  description: "Everyone building market theses on Bread.",
  alternates: { canonical: "/users" },
};

type Props = {
  searchParams: Promise<{ q?: string; offset?: string }>;
};

/** `?offset=` is user-editable, so it is clamped to a real page boundary. */
function parseOffset(raw: string | undefined): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value / DIRECTORY_PAGE_SIZE) * DIRECTORY_PAGE_SIZE;
}

function buildHref(query: string, offset: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (offset > 0) params.set("offset", String(offset));
  const search = params.toString();
  return search ? `/users?${search}` : "/users";
}

function UserCard({ user }: { user: DirectoryUser }) {
  const name = user.name?.trim() || null;
  const handle = `@${user.username}`;

  return (
    <Link href={`/u/${user.username}`} className={appStyles.userCard}>
      <Avatar src={user.avatarUrl} name={name ?? user.username} />
      <span>
        <strong className={appStyles.userCardName}>{name ?? handle}</strong>
        {/* The handle is the identity; it only earns a second line when a
            display name is occupying the first. */}
        {name ? <span className={appStyles.userCardHandle}>{handle}</span> : null}
        {user.bio ? <span className={appStyles.userCardBio}>{user.bio}</span> : null}
        <span className={appStyles.userCardStats}>
          <span>
            <strong>{user.followerCount}</strong>{" "}
            {user.followerCount === 1 ? "follower" : "followers"}
          </span>
          <span>
            <strong>{user.sandwichCount}</strong>{" "}
            {user.sandwichCount === 1 ? "sandwich" : "sandwiches"}
          </span>
        </span>
      </span>
    </Link>
  );
}

export default async function UsersPage({ searchParams }: Props) {
  const { q, offset: rawOffset } = await searchParams;
  const query = q?.trim().replace(/^@+/, "") ?? "";
  const offset = parseOffset(rawOffset);

  const directory = await getUserDirectory({ query, offset });

  // A page past the end of a filtered list is a dead end rather than an error:
  // the pager below simply offers the way back.
  const first = directory.total === 0 ? 0 : offset + 1;
  const last = offset + directory.users.length;
  const previousOffset = offset > 0 ? Math.max(offset - DIRECTORY_PAGE_SIZE, 0) : null;

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <PageHead eyebrow="Bread community" title="Everyone on Bread">
          Every account with a handle, most-followed first. Open one to read their sandwiches,
          holdings, and track record.
        </PageHead>

        <div className={appStyles.directoryTools}>
          <form className={appStyles.searchForm} action="/users" method="get">
            <input
              className={appStyles.searchInput}
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by handle or name"
              aria-label="Search people"
            />
            <button className={appStyles.searchButton} type="submit">
              Search
            </button>
          </form>
          <span className={appStyles.directoryCount}>
            {directory.users.length > 0
              ? `${first}–${last} of ${directory.total}`
              : `${directory.total} people`}
          </span>
        </div>

        {directory.users.length > 0 ? (
          <section className={appStyles.userGrid} aria-label="Bread members">
            {directory.users.map((user) => (
              <UserCard user={user} key={user.privyUserId} />
            ))}
          </section>
        ) : (
          <section className={styles.emptyState}>
            <div className={styles.stateCard}>
              <h2>Nobody here</h2>
              <p>
                {query
                  ? `No handle or name matches “${query}”.`
                  : offset > 0
                    ? "This page is past the end of the directory."
                    : "The member directory is empty right now."}
              </p>
              {query || offset > 0 ? (
                <Link href={buildHref(query, 0)} className={styles.primaryLink}>
                  {query ? "Clear search" : "Back to the first page"}
                </Link>
              ) : (
                <a href="bread://sandwich" className={styles.primaryLink}>
                  Open Bread
                </a>
              )}
            </div>
          </section>
        )}

        {previousOffset !== null || directory.nextOffset !== null ? (
          <nav className={appStyles.pager} aria-label="Directory pages">
            {previousOffset !== null ? (
              <Link href={buildHref(query, previousOffset)} className={appStyles.pagerLink}>
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {directory.nextOffset !== null ? (
              <Link href={buildHref(query, directory.nextOffset)} className={appStyles.pagerLink}>
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        <ReadOnlyNote>
          Public profile data only. Following and trading happen in the Bread app.
        </ReadOnlyNote>
        <div className={appStyles.bottomSpace} />
      </div>
    </main>
  );
}
