/** Seeded demo staff, shown on the sign-in screen so anyone can try Roshni. */
export interface DemoStaff {
  email: string;
  password: string;
  name: string;
  role: "teacher" | "admin";
  className: string | null;
  blurb: string;
}

export const DEMO_PASSWORD = "roshni123";

export const DEMO_STAFF: DemoStaff[] = [
  {
    email: "meena.rao@roshni.school",
    password: DEMO_PASSWORD,
    name: "Meena Rao",
    role: "teacher",
    className: "7B",
    blurb: "Class teacher, 7B — 22 children",
  },
  {
    email: "anil.kumar@roshni.school",
    password: DEMO_PASSWORD,
    name: "Anil Kumar",
    role: "teacher",
    className: "6A",
    blurb: "Class teacher, 6A — 22 children",
  },
  {
    email: "fatima.sheikh@roshni.school",
    password: DEMO_PASSWORD,
    name: "Fatima Sheikh",
    role: "teacher",
    className: "8A",
    blurb: "Class teacher, 8A — 22 children",
  },
  {
    email: "sunita.desai@roshni.school",
    password: DEMO_PASSWORD,
    name: "Sunita Desai",
    role: "admin",
    className: null,
    blurb: "Head teacher — all five classes",
  },
];
