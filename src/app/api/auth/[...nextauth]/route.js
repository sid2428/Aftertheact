import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getServiceSupabase } from '@/lib/supabase';
import crypto from 'crypto';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      const supabase = getServiceSupabase();
      
      // Check if user exists in our database
      const { data: existingUser, error: checkError } = await supabase
        .from('User')
        .select('id, username')
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
          .select('id')
          .single();
          
        if (insertError) {
          console.error('Error inserting user:', insertError);
          return false;
        }
        
        user.dbId = newUser.id;
        user.username = tempUsername;
      } else {
        user.dbId = existingUser.id;
        user.username = existingUser.username;
      }
      
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.dbId = user.dbId;
        token.username = user.username;
      }
      // Handle username updates from client
      if (trigger === "update" && session?.username) {
        token.username = session.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.dbId;
        session.user.username = token.username;
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
