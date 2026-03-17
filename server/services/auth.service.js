import bcrypt from 'bcryptjs';
import { supabase } from '../integrations/supabase.js';

export async function registerBusiness(data) {
    const hashed = bcrypt.hashSync(data.password, 10);

    const { data: inserted, error } = await supabase
        .from('business_info')
        .insert([{ ...data, password: hashed }])
        .select('id')
        .single();

    if (error) throw new Error(error.message);

    return { success: true, insertedId: inserted.id };
}

export async function login(req, res) {
    const { email, password } = req.body;
    const { data: user, error } = await supabase
        .from('business_info')
        .select(`id,email,password,horeca_name,manager_first_name,manager_last_name,logo`)
        .eq('email', email)
        .maybeSingle();

    if (error) throw new Error('Database error');
    if (!user || !bcrypt.compareSync(password, user.password)) {
        throw new Error('Invalid credentials');
    }

    req.session.user = {
        id: user.id,
        email: user.email,
        horeca_name: user.horeca_name,
        manager_first_name: user.manager_first_name,
        manager_last_name: user.manager_last_name,
        logo: user.logo,
    };

    return { success: true, business_id: user.id, horeca_name: user.horeca_name };
}
