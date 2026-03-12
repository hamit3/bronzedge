import { AuthProvider } from "@refinedev/core";
import { supabaseClient } from "./supabase-client";

const authProvider: AuthProvider = {
  login: async ({ email, password, providerName }) => {
    // sign in with oauth
    try {
      if (providerName) {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
          provider: providerName,
        });

        if (error) {
          return {
            success: false,
            error,
          };
        }

        if (data?.url) {
          return {
            success: true,
            redirectTo: "/monitoring",
          };
        }
      }

      // sign in with email and password
      console.log("Attempting login for:", email);
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
        });

      if (error) {
        console.error("Supabase Login Error:", error.message, error.status);
        return {
          success: false,
          error,
        };
      }

      if (data?.user) {
        return {
          success: true,
          redirectTo: "/monitoring",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Login failed",
        name: "Invalid email or password",
      },
    };
  },
  register: async ({ email, password }) => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        return {
          success: true,
          redirectTo: "/monitoring",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Register failed",
        name: "Invalid email or password",
      },
    };
  },
  forgotPassword: async ({ email }) => {
    try {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/update-password`,
        }
      );

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        return {
          success: true,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: false,
      error: {
        message: "Forgot password failed",
        name: "Invalid email",
      },
    };
  },
  updatePassword: async ({ password }) => {
    try {
      const { data, error } = await supabaseClient.auth.updateUser({
        password,
      });

      if (error) {
        return {
          success: false,
          error,
        };
      }

      if (data) {
        return {
          success: true,
          redirectTo: "/monitoring",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error,
      };
    }
    return {
      success: false,
      error: {
        message: "Update password failed",
        name: "Invalid password",
      },
    };
  },
  logout: async () => {
    // Clear mimic data on logout
    localStorage.removeItem("mimic_user_id");
    localStorage.removeItem("mimic_user_name");
    localStorage.removeItem("mimic_user_email");
    localStorage.removeItem("mimic_user_role");

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      redirectTo: "/",
    };
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
  check: async () => {
    try {
      const { data } = await supabaseClient.auth.getSession();
      const { session } = data;

      if (!session) {
        // Clear mimic data if session is lost
        localStorage.removeItem("mimic_user_id");
        localStorage.removeItem("mimic_user_name");
        localStorage.removeItem("mimic_user_email");
        localStorage.removeItem("mimic_user_role");

        return {
          authenticated: false,
          error: {
            message: "Check failed",
            name: "Session not found",
          },
          logout: true,
          redirectTo: "/login",
        };
      }
    } catch (error: any) {
      return {
        authenticated: false,
        error: error || {
          message: "Check failed",
          name: "Not authenticated",
        },
        logout: true,
        redirectTo: "/login",
      };
    }

    return {
      authenticated: true,
    };
  },
  getPermissions: async () => {
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      if (!authData?.user) return null;

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();
      
      const role = profile?.role || "user";
      return role;
    } catch (e) {
      console.error("[Auth] getPermissions Error:", e);
      return "user";
    }
  },
  getIdentity: async () => {
    try {
      const { data: authData } = await supabaseClient.auth.getUser();
      if (!authData?.user) return null;

      const { data: realProfile } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      const realRole = realProfile?.role || "user";
      const mimicId = localStorage.getItem("mimic_user_id");

      if (mimicId) {
        const { data: mimicProfile } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", mimicId)
          .maybeSingle();

        const identity = {
          ...authData.user,
          ...(mimicProfile || {}),
          id: mimicId, // Use mimic ID for filtering
          name: mimicProfile?.full_name || localStorage.getItem("mimic_user_name") || authData.user.email,
          email: mimicProfile?.email || localStorage.getItem("mimic_user_email") || authData.user.email,
          role: mimicProfile?.role || "user",
          isMimicked: true,
          realId: authData.user.id,
          realRole: realRole,
        };
        console.log("[Auth] Mimic Active:", identity.id, "| Real Role:", realRole);
        return identity;
      }

      const identity = {
        ...authData.user,
        ...realProfile,
        id: authData.user.id,
        name: realProfile?.full_name || authData.user.email,
        email: realProfile?.email || authData.user.email,
        role: realRole,
        isMimicked: false,
        realId: authData.user.id,
        realRole: realRole,
      };
      console.log("[Auth] Normal Identity Active:", identity.id);
      return identity;
    } catch (e) {
      console.error("[Auth] Identity error:", e);
      return null;
    }
  },
};

export default authProvider;
