import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const notConfiguredError = new Error(
  "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or migrate this feature to backend APIs."
);

const createQueryBuilder = () => {
  const builder = {};
  const chain = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "in",
    "gte",
    "lte",
    "lt",
    "gt",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
  ];

  chain.forEach((method) => {
    builder[method] = () => builder;
  });

  // Make the builder awaitable: `await supabase.from(...).select(...)`
  builder.then = (resolve) => resolve({ data: null, error: notConfiguredError });
  builder.catch = () => builder;
  builder.finally = () => builder;

  return builder;
};

const createMockSupabaseClient = () => ({
  auth: {
    getSession: async () => ({ data: { session: null }, error: notConfiguredError }),
    getUser: async () => ({ data: { user: null }, error: notConfiguredError }),
    signUp: async () => ({ data: null, error: notConfiguredError }),
    signInWithPassword: async () => ({ data: null, error: notConfiguredError }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: () => createQueryBuilder(),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: notConfiguredError }),
      download: async () => ({ data: null, error: notConfiguredError }),
      remove: async () => ({ data: null, error: notConfiguredError }),
      list: async () => ({ data: [], error: notConfiguredError }),
      getPublicUrl: () => ({ data: { publicUrl: null } }),
    }),
  },
});

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockSupabaseClient();

