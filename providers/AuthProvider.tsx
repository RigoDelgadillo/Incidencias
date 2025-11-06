import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

interface AuthData {
  loading: boolean;
  session: Session | null;
  role?: number | null;
}

const AuthContext = createContext<AuthData>({
  loading: true,
  session: null,
  role: null,
});

interface Props {
  children: React.ReactNode;
}

export default function AuthProvider(props: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSessionAndRole() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const currentSession = data.session ?? null;
        if (!mounted) return;

        setSession(currentSession);

        if (currentSession?.user?.id) {
          const { data: profile, error: profileErr } = await supabase
            .from("usuarios")
            .select("id_rol")
            .eq("id_usuario", currentSession.user.id)
            .maybeSingle();

          if (profileErr) {
            setRole(null);
            router.replace("/(auth)/login");
          } else {
            const roleNum = profile?.id_rol ? Number(profile.id_rol) : null;
            setRole(roleNum);

            if (roleNum === 1) router.replace("/(admin)");
            else if (roleNum === 2) router.replace("/(user)");
            else if (roleNum === 3) router.replace("/(tecnico)");
            else router.replace("/(auth)/login");
          }
        } else {
          router.replace("/(auth)/login");
        }
      } catch (e) {
        router.replace("/(auth)/login");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSessionAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session ?? null);
      setLoading(true);

      try {
        if (session?.user?.id) {
          const { data: profile, error: profileErr } = await supabase
            .from("usuarios")
            .select("id_rol")
            .eq("id_usuario", session.user.id)
            .maybeSingle();

          if (profileErr) {
            setRole(null);
            router.replace("/(auth)/login");
          } else {
            const roleNum = profile?.id_rol ? Number(profile.id_rol) : null;
            setRole(roleNum);

            if (roleNum === 1) router.replace("/(admin)");
            else if (roleNum === 2) router.replace("/(user)");
            else if (roleNum === 3) router.replace("/(tecnico)");
            else router.replace("/(auth)/login");
          }
        } else {
          setRole(null);
          router.replace("/(auth)/login");
        }
      } catch (err) {
        router.replace("/(auth)/login");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, role }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);