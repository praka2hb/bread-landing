import { redirect } from "next/navigation";

/** The directory is a list of people; `/user` is a near-miss worth catching. */
export default function UserRedirect() {
  redirect("/users");
}
