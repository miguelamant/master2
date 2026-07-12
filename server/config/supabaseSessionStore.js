// server/config/supabaseSessionStore.js
import session from "express-session";
import { supabase } from "../integrations/supabase.js";

const TABLE = "user_sessions";
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // fallback for cookie-less sessions
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// Persists express-session data in Supabase so logins survive server
// restarts/redeploys — a plain in-memory store loses every session on deploy.
export class SupabaseSessionStore extends session.Store {
    constructor() {
        super();
        const sweep = () => supabase.from(TABLE).delete().lt("expire", new Date().toISOString());
        sweep();
        setInterval(sweep, CLEANUP_INTERVAL_MS).unref();
    }

    async get(sid, cb) {
        try {
            const { data, error } = await supabase
                .from(TABLE)
                .select("sess, expire")
                .eq("sid", sid)
                .maybeSingle();
            if (error) return cb(error);
            if (!data || new Date(data.expire) < new Date()) return cb(null, null);
            cb(null, data.sess);
        } catch (e) {
            cb(e);
        }
    }

    async set(sid, sessionData, cb) {
        try {
            const maxAge = sessionData.cookie?.maxAge ?? DEFAULT_MAX_AGE_MS;
            const expire = new Date(Date.now() + maxAge).toISOString();
            const { error } = await supabase.from(TABLE).upsert({ sid, sess: sessionData, expire });
            cb(error || null);
        } catch (e) {
            cb(e);
        }
    }

    async destroy(sid, cb) {
        try {
            const { error } = await supabase.from(TABLE).delete().eq("sid", sid);
            cb(error || null);
        } catch (e) {
            cb(e);
        }
    }

    async touch(sid, sessionData, cb) {
        try {
            const maxAge = sessionData.cookie?.maxAge ?? DEFAULT_MAX_AGE_MS;
            const expire = new Date(Date.now() + maxAge).toISOString();
            const { error } = await supabase.from(TABLE).update({ expire }).eq("sid", sid);
            cb(error || null);
        } catch (e) {
            cb(e);
        }
    }
}
