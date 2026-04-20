import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envFile = readFileSync(resolve(__dirname, '.env'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY - using anon key (this may not work for admin operations)');
  console.log('\nTo create users with admin privileges, you need the service role key from Supabase dashboard.');
  console.log('Attempting with anon key...\n');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || envVars.VITE_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  try {
    if (supabaseServiceKey) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'geosom@geo.fr',
        password: 'Ali756638@@//**.&&$$##',
        email_confirm: true,
        user_metadata: {
          full_name: 'Admin GEOSOM'
        }
      });

      if (authError) {
        console.error('Error creating user:', authError.message);
        return;
      }

      console.log('User created:', authData.user.id);

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: 'Admin GEOSOM',
          role: 'admin'
        });

      if (profileError) {
        console.error('Error creating profile:', profileError.message);
        return;
      }

      console.log('\n✓ Admin user created successfully!');
      console.log('Email: geosom@geo.fr');
      console.log('Password: Ali756638@@//**.&&$$##');
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'geosom@geo.fr',
        password: 'Ali756638@@//**.&&$$##',
        options: {
          data: {
            full_name: 'Admin GEOSOM'
          }
        }
      });

      if (authError) {
        console.error('Error creating user:', authError.message);
        return;
      }

      console.log('User created:', authData.user?.id);

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: 'Admin GEOSOM',
            role: 'admin'
          });

        if (profileError) {
          console.error('Error creating profile:', profileError.message);
          return;
        }
      }

      console.log('\n✓ Admin user created successfully!');
      console.log('Email: geosom@geo.fr');
      console.log('Password: Ali756638@@//**.&&$$##');
      console.log('\nNote: You may need to confirm the email address in Supabase dashboard.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdmin();
