// Supabase Configuration
const SUPABASE_URL = 'https://ccpywshuedlvcaucjsbq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WQ2ANdx2Jibf2q-rP1_vWQ_8Eqk5rlB';

// Initialize Supabase client
// Note: This assumes the Supabase CDN script is loaded in the HTML before this file
let supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    console.error("Supabase library not loaded. Please ensure the CDN script is included.");
}

const api = {
    // Auth
    register: async (data) => {
        const { data: authData, error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    full_name: data.fullName,
                    phone: data.phone,
                    role: data.role || 'attendee'
                }
            }
        });
        return { ok: !error, json: () => Promise.resolve(error ? { message: error.message } : authData) };
    },
    login: async (data) => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
        });
        return { ok: !error, json: () => Promise.resolve(error ? { message: error.message } : authData) };
    },

    // Events
    getEvents: async () => {
        const { data, error } = await supabase.from('events').select('*').order('event_date');
        if (error) throw error;
        return data;
    },
    getEvent: async (id) => {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
        if (error) throw error;
        return data;
    },
    createEvent: async (eventData) => {
        const { data, error } = await supabase.from('events').insert([eventData]).select();
        if (error) throw error;
        return data;
    },

    // Tickets
    getMyTickets: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { data, error } = await supabase.from('tickets').select('*, events(*)').eq('user_id', user.id);
        if (error) throw error;
        return data;
    },
    purchaseTicket: async (ticketData) => {
        const { data, error } = await supabase.from('tickets').insert([ticketData]).select();
        if (error) throw error;
        return data;
    },

    // Profile
    getProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }
};

// Add to window for global access
window.gentsApi = api;
window.supabaseClient = supabase;
