// src/types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** UUID string for the user (primary key in users table) */
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string | null;
    };
  }

  // you can also extend the default User type if you consume it
  interface User {
    id: string;
    role?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** store the DB id as a string UUID */
    id?: string;
    role?: string;
  }
}
