import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServiceSupabase } from '@/lib/supabase';
import crypto from 'crypto';
import { redis } from '@/lib/upstash';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Showrunner (admin) login. Two factors: a one-time code mailed to the fixed
    // admin inbox (see /api/auth/showrunner-otp) AND the id/password. The login
    // page itself lives at an unlinked secret URL, so this is never reachable
    // from the public UI. Credentials default to the agreed values but can be
    // overridden via env (SHOWRUNNER_ID / SHOWRUNNER_PASSWORD) in production.
    CredentialsProvider({
      name: 'Showrunner',
      id: 'showrunner-login',
      credentials: {
        username: { label: "Showrunner ID", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "Access Code", type: "text" }
      },
      async authorize(credentials) {
        const otp = credentials?.otp?.trim();
        const username = credentials?.username;
        const password = credentials?.password;
        if (!otp || !username || !password) {
          throw new Error("All fields are required");
        }

        // Verify the one-time code first.
        const storedOtp = await redis.get("showrunner:otp");
        if (!storedOtp || storedOtp.toString() !== otp) {
          throw new Error("Invalid or expired access code");
        }

        // Then the id/password.
        const expectedId = process.env.SHOWRUNNER_ID || "Shivtik@1515";
        const expectedPassword = process.env.SHOWRUNNER_PASSWORD || "Shivtik@151515";
        if (username !== expectedId || password !== expectedPassword) {
          throw new Error("Invalid credentials");
        }

        // Burn the code so it can't be replayed.
        await redis.del("showrunner:otp");

        return { id: "admin-master", name: "Showrunner", email: "admin@aftertheact.com", isAdmin: true };
      }
    }),
    CredentialsProvider({
      name: 'Email OTP',
      id: 'email-otp',
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) return null;

        // Normalize identically to send-otp (trim + lowercase) so the Redis key
        // matches no matter how the user typed/cased their email. Otherwise a
        // stray space or capital letter makes a valid OTP look "expired".
        const email = credentials.email.trim().toLowerCase();

        const storedOtp = await redis.get(`otp:${email}`);
        if (!storedOtp || storedOtp.toString() !== credentials.otp.trim()) {
           throw new Error("Invalid or expired OTP");
        }

        await redis.del(`otp:${email}`);

        return { id: email, email, isEmailOtp: true };
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'showrunner-login' || (account?.provider === 'credentials' && user.id === 'admin-master')) {
        // Admin credentials bypass DB entirely
        user.dbId = user.id;
        user.username = user.name;
        user.isAdmin = true;
        user.onboarded = true; // admin skips the name/bio prompt
        return true;
      }

      if (!user.email) return false;
      
      const supabase = getServiceSupabase();
      
      // Check if user exists in our database
      const { data: existingUser, error: checkError } = await supabase
        .from('User')
        .select('id, username, is_admin, onboarded, avatar_url')
        .eq('email', user.email)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine. Other errors we should log.
        console.error('Error checking user:', checkError);
        return false;
      }
      
      if (!existingUser) {
        // Create new user
        // Generate a random temporary username since it's required and unique
        const tempUsername = 'u_' + crypto.randomBytes(4).toString('hex');
        
        const { data: newUser, error: insertError } = await supabase
          .from('User')
          .insert({
            email: user.email,
            username: tempUsername,
            avatar_url: user.image || null,
            google_id: account.provider === 'google' ? account.providerAccountId : null,
          })
          .select('id, is_admin')
          .single();
          
        if (insertError) {
          console.error('Error inserting user:', insertError);
          return false;
        }

        // Karma starts at 1000 (see migration 0028). The User column DEFAULT
        // already shows 1000; this baseline ledger row is what makes the floor
        // survive every reveal re-sum (totals = SUM(ledger)). Best-effort.
        const { error: baselineError } = await supabase
          .from('LatentPointsLedger')
          .insert({ user_id: newUser.id, episode_id: null, action_type: 'baseline', points: 1000 });
        if (baselineError) console.error('Error seeding karma baseline:', baselineError);

        user.dbId = newUser.id;
        user.username = tempUsername;
        user.isAdmin = newUser.is_admin || false;
        user.onboarded = false; // brand-new user must pick a name + bio
      } else {
        user.dbId = existingUser.id;
        user.username = existingUser.username;
        user.isAdmin = existingUser.is_admin || false;
        user.onboarded = existingUser.onboarded || false;

        // Backfill the Google profile photo so Gmail users show their real
        // picture instead of a name-initial fallback. Only fill when we have no
        // avatar yet, so a user's custom uploaded avatar is never clobbered.
        if (account?.provider === 'google' && user.image && !existingUser.avatar_url) {
          const { error: avatarError } = await supabase
            .from('User')
            .update({ avatar_url: user.image })
            .eq('id', existingUser.id);
          if (avatarError) console.error('Error backfilling avatar:', avatarError);
        }
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.dbId = user.dbId;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
        token.onboarded = user.onboarded;
        if (user.email) token.email = user.email;

        // Fallback for Credentials provider where signIn mutations might be lost
        if (!token.dbId) {
          if (user.id === 'admin-master') {
            token.dbId = user.id;
            token.username = user.name || "admin";
            token.isAdmin = true;
            token.onboarded = true;
          } else if (user.email) {
            const supabase = getServiceSupabase();
            const { data: dbUser } = await supabase.from('User').select('id, username, is_admin, onboarded').eq('email', user.email).single();
            if (dbUser) {
              token.dbId = dbUser.id;
              token.username = dbUser.username;
              token.isAdmin = dbUser.is_admin || false;
              token.onboarded = dbUser.onboarded || false;
            }
          }
        }
      }
      // Handle profile updates from client (onboarding / profile edits)
      if (trigger === "update" && session) {
        if (session.username) token.username = session.username;
        if (typeof session.onboarded === "boolean") token.onboarded = session.onboarded;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.dbId;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin;
        session.user.onboarded = token.onboarded;
        session.user.email = token.email || session.user.email;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
